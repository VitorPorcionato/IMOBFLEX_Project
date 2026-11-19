package br.com.imobflex;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class PrivacyController {
  final PrivacyService privacy;
  final Db db;
  final Access access;
  final VisitIdentity identity;
  final PrivacyRetention retention;

  PrivacyController(
      PrivacyService p, Db db, Access a, VisitIdentity i, PrivacyRetention retention) {
    privacy = p;
    this.db = db;
    access = a;
    identity = i;
    this.retention = retention;
  }

  record Acceptance(@NotBlank String version, @AssertTrue boolean accepted) {}

  record Preference(boolean allowed) {}

  record Token(@NotBlank @Size(max = 128) String token) {}

  record Verification(@Email @NotBlank @Size(max = 254) String email) {}

  record Request(String token, @NotBlank String kind) {}

  record Entry(
      @Size(max = 500) String reason, @Size(max = 200) String recipient, LocalDate until) {}

  record Incident(
      @NotNull Instant known_at,
      @NotBlank @Size(max = 10000) String description,
      @NotBlank @Size(max = 5000) String risk,
      @NotBlank @Size(max = 120) String owner,
      @NotBlank @Size(max = 5000) String containment,
      boolean reportable) {}

  record Notice(
      @NotBlank @Size(max = 250) String anpd_protocol,
      @NotBlank @Size(max = 5000) String holders_notice) {}

  @GetMapping("/public/legal/{kind}")
  Map<String, String> document(@PathVariable String kind) {
    String text = privacy.document(kind);
    return Map.of("version", PrivacyService.VERSION, "text", text, "hash", AuthService.hash(text));
  }

  @GetMapping("/public/legal/{kind}/{version}")
  Map<String, String> archived(@PathVariable String kind, @PathVariable String version) {
    String text = privacy.document(kind, version);
    return Map.of("version", version, "text", text, "hash", AuthService.hash(text));
  }

  @PostMapping("/privacy/accept")
  void accept(@Valid @RequestBody Acceptance a) {
    privacy.accept(access.id(), a.version());
  }

  @PutMapping("/privacy/marketing")
  void marketing(@RequestBody Preference p) {
    privacy.marketing(access.id(), p.allowed());
  }

  @PostMapping("/public/privacy/unsubscribe")
  void unsubscribe(@Valid @RequestBody Token t, HttpServletRequest r) {
    privacy.rate("unsubscribe:" + r.getRemoteAddr());
    privacy.unsubscribe(t.token());
  }

  @PostMapping("/public/privacy/verify")
  Map<String, String> verify(@Valid @RequestBody Verification v, HttpServletRequest r) {
    privacy.verification(v.email().strip().toLowerCase(Locale.ROOT), r.getRemoteAddr());
    return Map.of("message", "Enviamos um link de verificação. Confira o e-mail informado.");
  }

  @GetMapping("/privacy/data")
  Map<String, Object> data() {
    return ownData(email());
  }

  @PostMapping("/public/privacy/data")
  Map<String, Object> verifiedData(@Valid @RequestBody Token t) {
    return ownData(privacy.verified(t.token()));
  }

  @PostMapping("/privacy/requests")
  Map<String, Long> request(@Valid @RequestBody Request r) {
    return Map.of("id", privacy.request(email(), r.kind()));
  }

  @PostMapping("/public/privacy/requests")
  Map<String, Long> verifiedRequest(@Valid @RequestBody Request r) {
    return Map.of("id", privacy.request(privacy.verified(r.token()), r.kind()));
  }

  Map<String, Object> ownData(String email) {
    var data = privacy.export(email);
    var rows =
        db.list(
            "SELECT i.visit_id,i.ciphertext,i.expires_at FROM visit_identity i JOIN visits v ON"
                + " v.id=i.visit_id JOIN users u ON u.id=v.client_id WHERE u.email=? AND"
                + " i.expires_at>CURRENT_TIMESTAMP(6)",
            email);
    for (var row : rows) {
      row.put("cpf", identity.crypt((String) row.remove("ciphertext"), true));
    }
    data.put("entry_identity", rows);
    return data;
  }

  String email() {
    return (String) access.user().get("email");
  }

  @GetMapping("/admin/privacy/retention")
  Map<String, Object> retention() {
    access.adminOnly();
    return retention.report();
  }

  @PostMapping("/admin/privacy/retention/run")
  void clean() {
    access.adminOnly();
    if (!retention.isEnabled())
      throw new Fault(
          409, "Revise o relatório e configure PRIVACY_RETENTION_ENABLED antes de executar.");
    retention.clean();
  }

  @GetMapping("/admin/privacy/requests")
  List<Map<String, Object>> requests() {
    access.adminOnly();
    return db.list("SELECT * FROM privacy_requests WHERE status<>'DONE' ORDER BY due_at");
  }

  record Answer(@NotBlank @Size(max = 5000) String response) {}

  @PostMapping("/admin/privacy/requests/{id}/answer")
  @Transactional
  public void answer(@PathVariable long id, @Valid @RequestBody Answer a) {
    access.adminOnly();
    var r = db.one("SELECT * FROM privacy_requests WHERE id=?", id);
    if ("DELETE".equals(r.get("kind"))) {
      Long user = r.get("user_id") == null ? null : Db.id(r, "user_id");
      String hold = privacy.hold(user);
      if (hold != null) throw new Fault(409, hold);
      privacy.erase((String) r.get("email"), user);
    }
    db.update(
        "UPDATE privacy_requests SET response=?,status='DONE',completed_at=CURRENT_TIMESTAMP(6)"
            + " WHERE id=?",
        a.response(),
        id);
    privacy.send((String) r.get("email"), "Resposta ao protocolo #" + id, a.response());
  }

  @PutMapping("/admin/properties/{id}/entry")
  @Transactional
  public void entry(@PathVariable long id, @Valid @RequestBody Entry e) {
    access.adminOnly();
    db.one("SELECT id FROM properties WHERE id=? FOR UPDATE", id);
    if (e.until() != null
        && (e.reason() == null
            || e.reason().isBlank()
            || e.recipient() == null
            || e.recipient().isBlank()
            || e.until().isBefore(LocalDate.now(VisitService.ZONE))))
      throw new Fault(400, "Informe justificativa, destinatário e vigência futura.");
    db.update(
        "UPDATE properties SET entry_reason=?,entry_recipient=?,entry_until=? WHERE id=?",
        e.until() == null ? null : e.reason(),
        e.until() == null ? null : e.recipient(),
        e.until(),
        id);
    db.audit(access.id(), "ENTRY_RULE", "property", id, "Regra de entrada atualizada");
  }

  @GetMapping("/visits/{id}/identity")
  Map<String, String> identity(@PathVariable long id) {
    var v = db.one("SELECT * FROM visits WHERE id=?", id);
    access.staff();
    if (!access.admin() && Db.id(v, "broker_id") != access.id())
      throw new Fault(403, "Visita de outro corretor.");
    var row =
        db.one(
            "SELECT ciphertext FROM visit_identity WHERE visit_id=? AND"
                + " expires_at>CURRENT_TIMESTAMP(6)",
            id);
    db.audit(access.id(), "READ_IDENTITY", "visit", id, "Consulta restrita de entrada");
    return Map.of("cpf", identity.crypt((String) row.get("ciphertext"), true));
  }

  @GetMapping("/admin/privacy/incidents")
  List<Map<String, Object>> incidents() {
    access.adminOnly();
    return db.list("SELECT * FROM privacy_incidents ORDER BY due_at");
  }

  @PostMapping("/admin/privacy/incidents")
  Map<String, Long> incident(@Valid @RequestBody Incident i) {
    access.adminOnly();
    if (i.known_at().isAfter(Instant.now()))
      throw new Fault(400, "Ciência não pode estar no futuro.");
    Set<LocalDate> holidays = new HashSet<>();
    for (var h : db.list("SELECT day FROM incident_holidays"))
      holidays.add(LocalDate.parse((String) h.get("day")));
    LocalDate due =
        PrivacyService.deadline(i.known_at().atZone(VisitService.ZONE).toLocalDate(), holidays);
    long id =
        db.insert(
            "INSERT INTO"
                + " privacy_incidents(known_at,due_at,description,risk,owner,containment,reportable)"
                + " VALUES (?,?,?,?,?,?,?)",
            java.sql.Timestamp.from(i.known_at()),
            java.sql.Timestamp.from(due.atTime(23, 59, 59).atZone(VisitService.ZONE).toInstant()),
            i.description(),
            i.risk(),
            i.owner(),
            i.containment(),
            i.reportable());
    for (var a : db.list("SELECT id FROM users WHERE role='ADMIN' AND active=TRUE"))
      privacy.notifyUser(
          Db.id(a, "id"),
          "Incidente #"
              + id
              + ": avaliar e comunicar ANPD e titulares até "
              + due
              + " quando aplicável. Registrar protocolo.");
    return Map.of("id", id);
  }

  @PutMapping("/admin/privacy/incidents/{id}/notice")
  void notice(@PathVariable long id, @Valid @RequestBody Notice n) {
    access.adminOnly();
    db.update(
        "UPDATE privacy_incidents SET anpd_protocol=?,holders_notice=? WHERE id=?",
        n.anpd_protocol(),
        n.holders_notice(),
        id);
  }

  @PutMapping("/admin/privacy/holidays/{day}")
  void holiday(@PathVariable LocalDate day, @Valid @RequestBody Answer a) {
    access.adminOnly();
    db.update(
        "INSERT INTO incident_holidays(day,name) VALUES (?,?) ON DUPLICATE KEY UPDATE"
            + " name=VALUES(name)",
        day,
        a.response());
  }
}
