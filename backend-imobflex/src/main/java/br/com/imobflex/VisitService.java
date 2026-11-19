package br.com.imobflex;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class VisitService {
  static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
  final PrivacyService privacy;
  final VisitIdentity identity;
  final Db db;
  final Access access;
  final PropertyService properties;
  final MailQueue mail;

  VisitService(
      Db db,
      Access access,
      PropertyService properties,
      MailQueue mail,
      PrivacyService privacy,
      VisitIdentity identity) {
    this.db = db;
    this.privacy = privacy;
    this.identity = identity;
    this.access = access;
    this.properties = properties;
    this.mail = mail;
  }

  static boolean advance(Instant start, Instant now) {
    return !start.isBefore(now.plusSeconds(86400));
  }

  boolean free(Map<String, Object> p, long client, Instant start) {
    var local = start.atZone(ZONE);
    long broker = Db.id(p, "broker_id");
    Instant end = start.plusSeconds(3600);
    if (!p.get("status").equals("AVAILABLE")
        || !advance(start, Instant.now())
        || local.getMinute() != 0
        || local.getSecond() != 0
        || local.getNano() != 0) return false;
    if (db.count("SELECT COUNT(*) FROM users WHERE id=? AND active=TRUE", broker) == 0)
      return false;
    if (db.count("SELECT COUNT(*) FROM calendar_years WHERE year=?", local.getYear()) == 0
        || db.count("SELECT COUNT(*) FROM holidays WHERE day=?", local.toLocalDate()) > 0)
      return false;
    if (db.count(
            "SELECT COUNT(*) FROM availability WHERE broker_id=? AND weekday=? AND start_hour<=?"
                + " AND end_hour>=?",
            broker,
            local.getDayOfWeek().getValue(),
            local.getHour(),
            local.getHour() + 1)
        == 0) return false;
    if (db.count(
            "SELECT COUNT(*) FROM calendar_blocks WHERE broker_id=? AND (property_id IS NULL OR"
                + " property_id=?) AND starts_at<? AND ends_at>?",
            broker,
            p.get("id"),
            Timestamp.from(end),
            Timestamp.from(start))
        > 0) return false;
    return db.count(
            "SELECT COUNT(*) FROM visits WHERE status IN ('SCHEDULED','CONFIRMED') AND starts_at<?"
                + " AND ends_at>? AND (property_id=? OR broker_id=? OR client_id=?)",
            Timestamp.from(end),
            Timestamp.from(start),
            p.get("id"),
            broker,
            client)
        == 0;
  }

  List<String> slots(long property, LocalDate day) {
    var p = properties.raw(property);
    if (!Set.of("AVAILABLE", "NEGOTIATING").contains(p.get("status")))
      throw new Fault(404, "Imóvel não encontrado.");
    if (day.isBefore(LocalDate.now(ZONE)) || day.isAfter(LocalDate.now(ZONE).plusDays(90)))
      throw new Fault(400, "Selecione uma data nos próximos 90 dias.");
    long client = access.id();
    var out = new ArrayList<String>();
    for (int h = 0; h < 24; h++) {
      Instant start = day.atTime(h, 0).atZone(ZONE).toInstant();
      if (free(p, client, start)) out.add(start.toString());
    }
    return out;
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public long book(long property, Instant start) {
    return book(property, start, null);
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public long book(long property, Instant start, String cpf) {
    properties.lock(property);
    var p = properties.raw(property);
    var user = access.user();
    privacy.requireTerms(Db.id(user, "id"));
    if (!user.get("role").equals("CLIENT"))
      throw new Fault(403, "Agendamento disponível para clientes.");
    long client = Db.id(user, "id"),
        broker =
            Db.id(p, "broker_id"); // deterministic locks serialize reservations across properties
    for (long id : java.util.stream.LongStream.of(client, broker).distinct().sorted().toArray())
      db.one("SELECT id FROM users WHERE id=? FOR UPDATE", id);
    db.list("SELECT year FROM calendar_years WHERE year=? FOR SHARE", start.atZone(ZONE).getYear());
    if (db.count("SELECT COUNT(*) FROM users WHERE id=? AND active=TRUE AND confirmed=TRUE", client)
        == 0) throw new Fault(401, "Conta indisponível.");
    if (start.isAfter(Instant.now().plusSeconds(90L * 86400)) || !free(p, client, start))
      throw new Fault(409, "Horário indisponível. Escolha outro horário.");
    long id =
        db.insert(
            "INSERT INTO visits(property_id,client_id,broker_id,starts_at,ends_at) VALUES"
                + " (?,?,?,?,?)",
            property,
            client,
            broker,
            Timestamp.from(start),
            Timestamp.from(start.plusSeconds(3600)));
    identity.save(id, p, cpf, start.plusSeconds(3600));
    mail.notify(
        client, "Solicitação de visita #" + id + " recebida. Aguarde a confirmação do corretor.");
    mail.notify(broker, "Nova visita #" + id + " aguardando confirmação.");
    db.audit(client, "BOOK", "visit", id, start.toString());
    return id;
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void status(long id, String status) {
    var initial = db.one("SELECT property_id FROM visits WHERE id=?", id);
    properties.lock(Db.id(initial, "property_id"));
    var v = db.one("SELECT * FROM visits WHERE id=? FOR UPDATE", id);
    var u = access.user();
    long actor = Db.id(u, "id");
    boolean staff = Set.of("ADMIN", "BROKER").contains(u.get("role"));
    if (staff) {
      if (!access.admin() && Db.id(v, "broker_id") != actor)
        throw new Fault(403, "Visita de outro corretor.");
    } else if (Db.id(v, "client_id") != actor) throw new Fault(403, "Visita de outro cliente.");
    String old = (String) v.get("status");
    Instant start = Instant.parse((String) v.get("starts_at"));
    if (!Set.of("SCHEDULED", "CONFIRMED").contains(old))
      throw new Fault(409, "Esta visita já foi encerrada.");
    if (status.equals("CANCELLED")) {
      if (!staff && start.isBefore(Instant.now().plusSeconds(43200)))
        throw new Fault(
            409,
            "Cancelamento online exige 12 horas de antecedência. Entre em contato com o corretor.");
    } else if (!staff)
      throw new Fault(403, "Somente a equipe pode confirmar ou finalizar visitas.");
    else if (status.equals("CONFIRMED")) {
      if (!old.equals("SCHEDULED") || !start.isAfter(Instant.now()))
        throw new Fault(409, "Visita não pode ser confirmada.");
    } else if (Set.of("COMPLETED", "NO_SHOW").contains(status)) {
      if (Instant.parse((String) v.get("ends_at")).isAfter(Instant.now()))
        throw new Fault(409, "Registre o resultado após o término da visita.");
    } else throw new Fault(400, "Status inválido.");
    db.update("UPDATE visits SET status=? WHERE id=?", status, id);
    if (status.equals("CANCELLED")) db.update("DELETE FROM visit_identity WHERE visit_id=?", id);
    mail.notify(Db.id(v, "client_id"), "Visita #" + id + ": " + label(status) + ".");
    mail.notify(Db.id(v, "broker_id"), "Visita #" + id + ": " + label(status) + ".");
    db.audit(actor, "STATUS", "visit", id, old + " -> " + status);
  }

  static String label(String status) {
    return switch (status) {
      case "CONFIRMED" -> "confirmada";
      case "CANCELLED" -> "cancelada";
      case "COMPLETED" -> "realizada";
      case "NO_SHOW" -> "não compareceu";
      default -> status;
    };
  }

  List<Map<String, Object>> list() {
    var u = access.user();
    String clause =
        switch ((String) u.get("role")) {
          case "ADMIN" -> "1=1";
          case "BROKER" -> "v.broker_id=" + u.get("id");
          default -> "v.client_id=" + u.get("id");
        };
    return db.list(
        "SELECT"
            + " v.id,v.property_id,v.client_id,v.broker_id,v.starts_at,v.ends_at,v.status,v.created_at,p.title,u.name"
            + " client_name FROM visits v JOIN properties p ON p.id=v.property_id LEFT JOIN users u"
            + " ON u.id=v.client_id WHERE "
            + clause
            + " ORDER BY v.starts_at DESC");
  }
}
