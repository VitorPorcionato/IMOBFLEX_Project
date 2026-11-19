package br.com.imobflex;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class ContactsController {
  final Db db;
  final Access access;
  final MailQueue mail;
  final PropertyService properties;

  ContactsController(Db db, Access access, MailQueue mail, PropertyService properties) {
    this.db = db;
    this.access = access;
    this.mail = mail;
    this.properties = properties;
  }

  record Contact(
      @Min(1) long property_id,
      @NotBlank @Size(max = 120) String name,
      @NotBlank @Email @Size(max = 254) String email,
      @Size(max = 30) String phone,
      @NotBlank @Size(min = 10, max = 4000) String message) {}

  record Reply(@NotBlank @Size(max = 4000) String message) {}

  @PostMapping("/public/contacts")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public Map<String, Long> create(
      @Valid @RequestBody Contact c, jakarta.servlet.http.HttpServletRequest request) {
    new PrivacyService(db, null).rate("contact:" + request.getRemoteAddr());
    properties.lock(c.property_id());
    var p = properties.raw(c.property_id());
    if (!Set.of("AVAILABLE", "NEGOTIATING").contains(p.get("status")))
      throw new Fault(409, "Imóvel indisponível para contato.");
    Long client = null;
    var a = SecurityContextHolder.getContext().getAuthentication();
    if (a != null && !a.getName().equals("anonymousUser")) client = access.id();
    long id =
        db.insert(
            "INSERT INTO contacts(property_id,broker_id,client_id,name,email,phone,message) VALUES"
                + " (?,?,?,?,?,?,?)",
            c.property_id(),
            p.get("broker_id"),
            client,
            c.name(),
            c.email(),
            c.phone(),
            c.message());
    mail.notify(
        Db.id(p, "broker_id"), "Novo contato #" + id + " sobre o imóvel #" + c.property_id());
    return Map.of("id", id);
  }

  @GetMapping("/contacts")
  List<Map<String, Object>> list() {
    var u = access.user();
    String where =
        switch ((String) u.get("role")) {
          case "ADMIN" -> "1=1";
          case "BROKER" -> "c.broker_id=" + u.get("id");
          default -> "c.client_id=" + u.get("id");
        };
    var rows =
        db.list(
            "SELECT c.*,p.title FROM contacts c JOIN properties p ON p.id=c.property_id WHERE "
                + where
                + " ORDER BY c.id DESC");
    for (var row : rows)
      row.put(
          "replies",
          db.list(
              "SELECT m.id,m.body,m.created_at,u.name author FROM messages m JOIN users u ON"
                  + " u.id=m.author_id WHERE contact_id=? ORDER BY m.id",
              row.get("id")));
    return rows;
  }

  @PostMapping("/contacts/{id}/replies")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void reply(@PathVariable long id, @Valid @RequestBody Reply r) {
    access.staff();
    var c = db.one("SELECT * FROM contacts WHERE id=?", id);
    if (!access.admin() && Db.id(c, "broker_id") != access.id())
      throw new Fault(403, "Contato atribuído a outro corretor.");
    db.update(
        "INSERT INTO messages(contact_id,author_id,body) VALUES (?,?,?)",
        id,
        access.id(),
        r.message());
    mail.enqueue(
        (String) c.get("email"), "Resposta sobre o imóvel #" + c.get("property_id"), r.message());
    if (c.get("client_id") != null)
      db.update(
          "INSERT INTO notifications(user_id,message) VALUES (?,?)",
          c.get("client_id"),
          "Seu contato #" + id + " recebeu uma resposta.");
    db.audit(access.id(), "REPLY", "contact", id, "Resposta enviada");
  }

  @GetMapping("/dashboard")
  Map<String, Object> dashboard() {
    access.staff();
    String propertyFilter = access.admin() ? "1=1" : "broker_id=" + access.id();
    return Map.of(
        "properties",
        db.list(
            "SELECT status,COUNT(*) total FROM properties WHERE "
                + propertyFilter
                + " GROUP BY status"),
        "visits",
        db.list(
            "SELECT status,COUNT(*) total FROM visits WHERE "
                + propertyFilter
                + " GROUP BY status"),
        "contacts",
        db.count("SELECT COUNT(*) FROM contacts WHERE " + propertyFilter),
        "pending_results",
        db.count(
            "SELECT COUNT(*) FROM visits WHERE "
                + propertyFilter
                + " AND ends_at<CURRENT_TIMESTAMP(6) AND status IN ('SCHEDULED','CONFIRMED')"));
  }
}
