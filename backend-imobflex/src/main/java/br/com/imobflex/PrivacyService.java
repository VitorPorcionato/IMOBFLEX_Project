package br.com.imobflex;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PrivacyService {
  static final String VERSION = "2026-11-16";
  final Db db;
  final MailQueue mail;

  PrivacyService(Db db, MailQueue mail) {
    this.db = db;
    this.mail = mail;
  }

  void send(String email, String subject, String body) {
    mail.enqueue(email, subject, body);
  }

  void notifyUser(long id, String message) {
    mail.notify(id, message);
  }

  String document(String kind) {
    return document(kind, VERSION);
  }

  String document(String kind, String version) {
    if (!Set.of("terms", "privacy").contains(kind)
        || version == null
        || !version.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))
      throw new Fault(404, "Documento não encontrado.");
    var resource = new ClassPathResource("legal/" + kind + "-" + version + ".txt");
    if (!resource.exists()) throw new Fault(404, "Versão não encontrada.");
    try (var stream = resource.getInputStream()) {
      return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (java.io.IOException e) {
      throw new IllegalStateException(e);
    }
  }

  void accept(long user, String version) {
    if (!VERSION.equals(version)) throw new Fault(409, "Os termos mudaram. Leia a versão atual.");
    db.update(
        "INSERT IGNORE INTO legal_acceptances(user_id,version,document_hash) VALUES (?,?,?)",
        user,
        version,
        AuthService.hash(document("terms")));
  }

  void requireTerms(long user) {
    if (db.count(
            "SELECT COUNT(*) FROM legal_acceptances WHERE user_id=? AND version=?", user, VERSION)
        == 0)
      throw new Fault(428, "Aceite os termos atuais na Central de Privacidade antes de continuar.");
  }

  static String random() {
    byte[] b = new byte[32];
    new SecureRandom().nextBytes(b);
    return HexFormat.of().formatHex(b);
  }

  @Transactional
  public void marketing(long user, boolean allowed) {
    db.one("SELECT id FROM users WHERE id=? FOR UPDATE", user);
    String raw = random();
    db.update(
        "INSERT INTO marketing_preferences(user_id,allowed,unsubscribe_hash) VALUES (?,?,?) ON"
            + " DUPLICATE KEY UPDATE allowed=VALUES(allowed),updated_at=CURRENT_TIMESTAMP(6)",
        user,
        allowed,
        AuthService.hash(raw));
    db.update(
        "INSERT INTO marketing_events(user_id,allowed,version) VALUES (?,?,?)",
        user,
        allowed,
        VERSION);
    if (allowed) {
      // The token is distributed only to the account address; GET never changes consent.
      db.update(
          "UPDATE marketing_preferences SET unsubscribe_hash=? WHERE user_id=?",
          AuthService.hash(raw),
          user);
      mail.enqueue(
          (String) db.one("SELECT email FROM users WHERE id=?", user).get("email"),
          "Sua preferência de ofertas",
          "Você autorizou ofertas de imóveis. Cancele a qualquer momento: "
              + mail.publicUrl()
              + "/descadastro?token="
              + raw);
    } else
      db.update(
          "UPDATE outbox SET status='CANCELLED',completed_at=CURRENT_TIMESTAMP(6) WHERE"
              + " category='MARKETING' AND recipient=(SELECT email FROM users WHERE id=?) AND"
              + " status IN ('PENDING','FAILED')",
          user);
  }

  @Transactional
  public void unsubscribe(String token) {
    var rows =
        db.list(
            "SELECT user_id FROM marketing_preferences WHERE unsubscribe_hash=? FOR UPDATE",
            AuthService.hash(token));
    if (!rows.isEmpty()) marketing(Db.id(rows.getFirst(), "user_id"), false);
  }

  void rate(String key) {
    String hash = AuthService.hash(key);
    db.update(
        "INSERT INTO privacy_rate_limits(bucket,attempts,expires_at) VALUES"
            + " (?,1,TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP(6))) ON DUPLICATE KEY UPDATE"
            + " attempts=IF(expires_at<CURRENT_TIMESTAMP(6),1,attempts+1),expires_at=IF(expires_at<CURRENT_TIMESTAMP(6),TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP(6)),expires_at)",
        hash);
    if (db.count("SELECT COUNT(*) FROM privacy_rate_limits WHERE bucket=? AND attempts>5", hash)
        > 0) throw new Fault(429, "Muitas tentativas. Aguarde uma hora.");
  }

  void verification(String email, String remote) {
    rate("privacy-ip:" + remote);
    rate("privacy-email:" + email);
    String raw = random();
    db.update(
        "INSERT INTO privacy_tokens(token_hash,email,expires_at) VALUES"
            + " (?,?,TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP(6)))",
        AuthService.hash(raw),
        email);
    mail.enqueue(
        email,
        "Acesse a Central de Privacidade",
        mail.publicUrl()
            + "/central-privacidade?token="
            + raw
            + "\nLink válido por uma hora. Não compartilhe.");
  }

  String verified(String token) {
    var rows =
        db.list(
            "SELECT email FROM privacy_tokens WHERE token_hash=? AND"
                + " expires_at>CURRENT_TIMESTAMP(6)",
            AuthService.hash(token));
    if (rows.isEmpty()) throw new Fault(400, "Link inválido ou expirado.");
    return (String) rows.getFirst().get("email");
  }

  Map<String, Object> export(String email) {
    Map<String, Object> result = new LinkedHashMap<>();
    var users =
        db.list(
            "SELECT id,name,email,phone,role,confirmed,active,created_at FROM users WHERE email=?",
            email);
    result.put("account", users);
    result.put(
        "contacts",
        db.list(
            "SELECT id,property_id,name,email,phone,message,created_at FROM contacts WHERE email=?",
            email));
    result.put(
        "replies",
        db.list(
            "SELECT m.body,m.created_at FROM messages m JOIN contacts c ON c.id=m.contact_id WHERE"
                + " c.email=?",
            email));
    result.put(
        "visits",
        db.list(
            "SELECT v.id,v.property_id,v.starts_at,v.ends_at,v.status FROM visits v JOIN users u ON"
                + " u.id=v.client_id WHERE u.email=?",
            email));
    result.put(
        "acceptances",
        db.list(
            "SELECT a.version,a.document_hash,a.accepted_at FROM legal_acceptances a JOIN users u"
                + " ON u.id=a.user_id WHERE u.email=?",
            email));
    result.put(
        "marketing",
        db.list(
            "SELECT p.allowed,p.updated_at FROM marketing_preferences p JOIN users u ON"
                + " u.id=p.user_id WHERE u.email=?",
            email));
    result.put(
        "marketing_history",
        db.list(
            "SELECT e.allowed,e.version,e.created_at FROM marketing_events e JOIN users u ON"
                + " u.id=e.user_id WHERE u.email=?",
            email));
    result.put(
        "requests",
        db.list(
            "SELECT id,kind,status,response,created_at,due_at FROM privacy_requests WHERE email=?"
                + " ORDER BY id DESC",
            email));
    return result;
  }

  @Transactional
  public long request(String email, String kind) {
    if (!Set.of("ACCESS", "DELETE").contains(kind)) throw new Fault(400, "Pedido inválido.");
    var rows = db.list("SELECT id FROM users WHERE email=? FOR UPDATE", email);
    Long user = rows.isEmpty() ? null : Db.id(rows.getFirst(), "id");
    long id =
        db.insert(
            "INSERT INTO privacy_requests(email,user_id,kind,due_at) VALUES"
                + " (?,?,?,TIMESTAMPADD(DAY,15,CURRENT_TIMESTAMP(6)))",
            email,
            user,
            kind);
    if (kind.equals("DELETE")) {
      if (user != null) {
        marketing(user, false);
        db.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", user.toString());
      }
      String hold = hold(user);
      if (hold != null)
        db.update(
            "UPDATE privacy_requests SET status='REVIEW',response=? WHERE id=?",
            hold + " Equipe deve resolver o vínculo e responder até o prazo indicado.",
            id);
      else {
        erase(email, user);
        db.update(
            "UPDATE privacy_requests SET status='DONE',response='Dados dispensáveis removidos;"
                + " prova mínima do protocolo por 12 meses.',completed_at=CURRENT_TIMESTAMP(6)"
                + " WHERE id=?",
            id);
      }
    }
    return id;
  }

  String hold(Long user) {
    if (user == null) return null;
    var u = db.one("SELECT role FROM users WHERE id=?", user);
    if (!u.get("role").equals("CLIENT"))
      return "Conta da equipe ou proprietário possui vínculos operacionais a revisar.";
    if (db.count(
            "SELECT COUNT(*) FROM visits WHERE client_id=? AND status IN ('SCHEDULED','CONFIRMED')"
                + " AND ends_at>CURRENT_TIMESTAMP(6)",
            user)
        > 0) return "Há visita futura que precisa ser resolvida antes da exclusão.";
    return null;
  }

  void erase(String email, Long user) {
    db.update(
        "DELETE m FROM messages m JOIN contacts c ON c.id=m.contact_id WHERE c.email=?", email);
    db.update("DELETE FROM contacts WHERE email=?", email);
    db.update("DELETE FROM outbox WHERE recipient=?", email);
    if (user != null) {
      db.update(
          "DELETE i FROM visit_identity i JOIN visits v ON v.id=i.visit_id WHERE v.client_id=?",
          user);
      db.update("UPDATE visits SET client_id=NULL WHERE client_id=?", user);
      db.update("DELETE FROM account_tokens WHERE user_id=?", user);
      db.update("DELETE FROM notifications WHERE user_id=?", user);
      db.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", user.toString());
      db.update(
          "UPDATE audit SET actor_id=NULL,details='Registro anonimizado' WHERE actor_id=?", user);
      db.update(
          "UPDATE legal_acceptances SET expires_at=TIMESTAMPADD(MONTH,12,CURRENT_TIMESTAMP(6))"
              + " WHERE user_id=? AND expires_at IS NULL",
          user);
      db.update(
          "UPDATE users SET name='Conta"
              + " removida',email=?,cpf=NULL,phone=NULL,address=NULL,password_hash='REVOKED',active=FALSE"
              + " WHERE id=?",
          "removed-" + user + "@example.invalid",
          user);
    }
  }

  static LocalDate deadline(LocalDate day, Set<LocalDate> holidays) {
    int days = 0;
    while (days < 3) {
      day = day.plusDays(1);
      if (day.getDayOfWeek() != DayOfWeek.SATURDAY
          && day.getDayOfWeek() != DayOfWeek.SUNDAY
          && !holidays.contains(day)) days++;
    }
    return day;
  }
}
