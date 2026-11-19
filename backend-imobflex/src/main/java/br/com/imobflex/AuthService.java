package br.com.imobflex;

import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AuthService {
  record Registration(
      @NotBlank @Size(max = 120) String name,
      String cpf,
      @Email @NotBlank @Size(max = 254) String email,
      @Size(max = 30) String phone,
      @Size(max = 500) String address,
      @NotBlank @Size(min = 8, max = 72) String password,
      Boolean terms_accepted,
      String terms_version,
      Boolean marketing) {}

  final PrivacyService privacy;
  final Db db;
  final PasswordEncoder encoder;
  final MailQueue mail;
  final String url;

  AuthService(
      Db db,
      PrivacyService privacy,
      PasswordEncoder encoder,
      MailQueue mail,
      @Value("${app.public-url}") String url) {
    this.db = db;
    this.privacy = privacy;
    this.encoder = encoder;
    this.mail = mail;
    this.url = url;
  }

  public String encode(String p) {
    return encoder.encode(p);
  }

  public boolean matches(String p, String hash) {
    return encoder.matches(p, hash);
  }

  static void password(String p) {
    if (p == null
        || p.length() < 8
        || p.getBytes(StandardCharsets.UTF_8).length > 72
        || !p.matches("(?s).*[A-Z].*")
        || !p.matches("(?s).*[a-z].*")
        || !p.matches("(?s).*[0-9].*"))
      throw new Fault(
          400, "Senha: mínimo 8 caracteres, maiúscula, minúscula e número; máximo 72 bytes.");
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public long register(Registration r, String role) {
    if (role.equals("CLIENT")
        && (!Boolean.TRUE.equals(r.terms_accepted())
            || !PrivacyService.VERSION.equals(r.terms_version())))
      throw new Fault(400, "Leia e aceite a versão atual dos Termos de Uso.");
    password(r.password());
    long id =
        db.insert(
            "INSERT INTO users(name,cpf,email,phone,address,password_hash,role) VALUES"
                + " (?,?,?,?,?,?,?)",
            r.name().strip(),
            null,
            r.email().strip().toLowerCase(Locale.ROOT),
            role.equals("CLIENT") ? null : r.phone(),
            null,
            encoder.encode(r.password()),
            role);
    if (role.equals("CLIENT")) {
      privacy.accept(id, r.terms_version());
      privacy.marketing(id, Boolean.TRUE.equals(r.marketing()));
    }
    token(id, "CONFIRM", 24);
    return id;
  }

  static String hash(String token) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  void token(long id, String purpose, int hours) {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String raw = HexFormat.of().formatHex(bytes);
    db.update("UPDATE account_tokens SET used=TRUE WHERE user_id=? AND purpose=?", id, purpose);
    db.update(
        "INSERT INTO account_tokens(user_id,token_hash,purpose,expires_at) VALUES (?,?,?,?)",
        id,
        hash(raw),
        purpose,
        Timestamp.from(Instant.now().plusSeconds(hours * 3600L)));
    String path = purpose.equals("CONFIRM") ? "confirmar-email" : "redefinir-senha";
    mail.enqueue(
        (String) db.one("SELECT email FROM users WHERE id=?", id).get("email"),
        purpose.equals("CONFIRM") ? "Confirme seu cadastro" : "Redefina sua senha",
        url + "/" + path + "?token=" + raw);
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void requestToken(String email, String purpose) {
    var users =
        db.list(
            "SELECT id FROM users WHERE email=? AND active=TRUE",
            email.strip().toLowerCase(Locale.ROOT));
    if (!users.isEmpty())
      token(Db.id(users.getFirst(), "id"), purpose, purpose.equals("RESET") ? 1 : 24);
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void consume(String raw, String purpose, String password) {
    var rows =
        db.list(
            "SELECT * FROM account_tokens WHERE token_hash=? AND purpose=? FOR UPDATE",
            hash(raw),
            purpose);
    if (rows.isEmpty()) throw new Fault(400, "Link inválido ou expirado.");
    var t = rows.getFirst();
    if (Db.yes(t.get("used"))
        || !Instant.parse((String) t.get("expires_at")).isAfter(Instant.now()))
      throw new Fault(400, "Link inválido ou expirado.");
    long id = Db.id(t, "user_id");
    if (purpose.equals("CONFIRM")) db.update("UPDATE users SET confirmed=TRUE WHERE id=?", id);
    else {
      password(password);
      db.update(
          "UPDATE users SET password_hash=?,failed_logins=0,locked_until=NULL WHERE id=?",
          encoder.encode(password),
          id);
      db.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", Long.toString(id));
    }
    db.update("UPDATE account_tokens SET used=TRUE WHERE id=?", t.get("id"));
  }

  Map<String, Object> publicUser(long id) {
    return db.one(
        "SELECT id,name,cpf,email,phone,address,role,confirmed,active FROM users WHERE id=?", id);
  }
}
