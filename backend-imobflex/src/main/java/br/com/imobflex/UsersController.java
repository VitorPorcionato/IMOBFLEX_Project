package br.com.imobflex;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class UsersController {
  final Db db;
  final Access access;
  final AuthService auth;
  final PrivacyService privacy;

  UsersController(Db db, Access access, AuthService auth, PrivacyService privacy) {
    this.db = db;
    this.access = access;
    this.auth = auth;
    this.privacy = privacy;
  }

  record Staff(
      @NotNull @Valid AuthService.Registration user,
      @Pattern(regexp = "BROKER|OWNER") @NotNull String role) {}

  record Profile(
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Email @Size(max = 254) String email,
      @Size(max = 30) String phone,
      @Size(max = 500) String address) {}

  @GetMapping("/users")
  List<Map<String, Object>> users() {
    access.adminOnly();
    return db.list("SELECT id,name,email,phone,role,active,confirmed FROM users ORDER BY name");
  }

  @GetMapping("/users/options")
  List<Map<String, Object>> options() {
    access.staff();
    return db.list(
        "SELECT id,name,role FROM users WHERE active=TRUE AND role IN ('ADMIN','BROKER','OWNER')"
            + " ORDER BY name");
  }

  @PostMapping("/users")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public Map<String, Long> create(@Valid @RequestBody Staff s) {
    access.adminOnly();
    long id = auth.register(s.user(), s.role());
    db.audit(access.id(), "CREATE_USER", "user", id, s.role());
    return Map.of("id", id);
  }

  @PutMapping("/me")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void profile(@Valid @RequestBody Profile p) {
    var u = access.user();
    long id = Db.id(u, "id");
    String email = p.email().strip().toLowerCase(Locale.ROOT);
    boolean changed = !email.equals(u.get("email"));
    db.update(
        "UPDATE users SET name=?,email=?,phone=?,address=? WHERE id=?",
        p.name(),
        email,
        p.phone(),
        null,
        id);
    if (changed) {
      db.update("UPDATE users SET confirmed=FALSE WHERE id=?", id);
      db.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", Long.toString(id));
      auth.token(id, "CONFIRM", 24);
    }
    db.audit(id, "PROFILE", "user", id, "Perfil atualizado; e-mail alterado=" + changed);
  }

  @DeleteMapping("/me")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void deactivateSelf(HttpServletRequest request) {
    long id = access.id();
    deactivate(id);
    var session = request.getSession(false);
    if (session != null)
      org.springframework.transaction.support.TransactionSynchronizationManager
          .registerSynchronization(
              new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCommit() {
                  session.invalidate();
                }
              });
  }

  @DeleteMapping("/users/{id}")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void deactivateOther(@PathVariable long id) {
    access.adminOnly();
    if (id == access.id()) throw new Fault(409, "Use a opção de desativar sua conta.");
    deactivate(id);
  }

  void deactivate(long id) {
    var u = db.one("SELECT * FROM users WHERE id=? FOR UPDATE", id);
    if (u.get("role").equals("ADMIN")
        && db.count("SELECT COUNT(*) FROM users WHERE role='ADMIN' AND active=TRUE") <= 1)
      throw new Fault(409, "O administrador inicial não pode ser desativado.");
    if (db.count(
            "SELECT COUNT(*) FROM visits WHERE (client_id=? OR broker_id=?) AND"
                + " starts_at>CURRENT_TIMESTAMP(6) AND status IN ('SCHEDULED','CONFIRMED')",
            id,
            id)
        > 0) throw new Fault(409, "Resolva as visitas futuras antes de desativar a conta.");
    if (db.count(
            "SELECT COUNT(*) FROM properties WHERE broker_id=? AND status IN"
                + " ('AVAILABLE','NEGOTIATING')",
            id)
        > 0) throw new Fault(409, "Reatribua ou inative os imóveis antes de desativar o corretor.");
    long actor = access.id();
    privacy.marketing(id, false);
    db.update(
        "UPDATE legal_acceptances SET expires_at=TIMESTAMPADD(MONTH,12,CURRENT_TIMESTAMP(6)) WHERE"
            + " user_id=? AND expires_at IS NULL",
        id);
    db.update("UPDATE users SET active=FALSE WHERE id=?", id);
    db.update("UPDATE account_tokens SET used=TRUE WHERE user_id=?", id);
    db.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", Long.toString(id));
    db.audit(actor, "DEACTIVATE", "user", id, "Conta desativada");
  }

  @GetMapping("/notifications")
  List<Map<String, Object>> notifications() {
    return db.list(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100", access.id());
  }

  @PatchMapping("/notifications/{id}/read")
  void read(@PathVariable long id) {
    db.update("UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?", id, access.id());
  }

  @GetMapping("/admin/audit")
  List<Map<String, Object>> audit() {
    access.adminOnly();
    return db.list("SELECT * FROM audit ORDER BY id DESC LIMIT 200");
  }

  @GetMapping("/admin/mail")
  List<Map<String, Object>> mail() {
    access.adminOnly();
    return db.list(
        "SELECT id,recipient,subject,status,attempts,last_error FROM outbox ORDER BY id DESC LIMIT"
            + " 100");
  }

  @PostMapping("/admin/mail/{id}/retry")
  void retry(@PathVariable long id) {
    access.adminOnly();
    db.update(
        "UPDATE outbox SET status='PENDING',attempts=0,next_attempt=CURRENT_TIMESTAMP(6) WHERE id=?"
            + " AND status='FAILED'",
        id);
  }
}
