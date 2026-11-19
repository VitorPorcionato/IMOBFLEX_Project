package br.com.imobflex;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/calendar")
class CalendarController {
  final Db db;
  final Access access;
  final PropertyService properties;

  CalendarController(Db db, Access access, PropertyService properties) {
    this.db = db;
    this.access = access;
    this.properties = properties;
  }

  record Window(
      @Min(1) @Max(7) int weekday,
      @Min(0) @Max(23) int start_hour,
      @Min(1) @Max(24) int end_hour) {}

  record Schedule(@Min(1) long broker_id, @NotNull List<@Valid Window> windows) {}

  record Block(
      @Min(1) long broker_id,
      Long property_id,
      @NotNull Instant starts_at,
      @NotNull Instant ends_at,
      @NotBlank @Size(max = 200) String reason) {}

  record Holiday(@NotNull LocalDate day, @NotBlank @Size(max = 150) String name) {}

  void broker(long id) {
    access.staff();
    if (!access.admin() && id != access.id()) throw new Fault(403, "Agenda de outro corretor.");
    if (db.count(
            "SELECT COUNT(*) FROM users WHERE id=? AND role IN ('ADMIN','BROKER') AND active=TRUE",
            id)
        == 0) throw new Fault(400, "Corretor inválido.");
  }

  @GetMapping
  Map<String, Object> get(@RequestParam long broker_id) {
    broker(broker_id);
    return Map.of(
        "windows",
        db.list(
            "SELECT * FROM availability WHERE broker_id=? ORDER BY weekday,start_hour", broker_id),
        "blocks",
        db.list("SELECT * FROM calendar_blocks WHERE broker_id=? ORDER BY starts_at", broker_id),
        "holidays",
        db.list("SELECT * FROM holidays ORDER BY day"),
        "years",
        db.list("SELECT * FROM calendar_years ORDER BY year"));
  }

  @PutMapping
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void save(@Valid @RequestBody Schedule input) {
    broker(input.broker_id());
    db.one("SELECT id FROM users WHERE id=? FOR UPDATE", input.broker_id());
    for (var a : input.windows()) {
      if (a.end_hour() <= a.start_hour()) throw new Fault(400, "Intervalo inválido.");
      for (var b : input.windows())
        if (a != b
            && a.weekday() == b.weekday()
            && a.start_hour() < b.end_hour()
            && a.end_hour() > b.start_hour())
          throw new Fault(400, "Intervalos de agenda sobrepostos.");
    }
    db.update("DELETE FROM availability WHERE broker_id=?", input.broker_id());
    for (var win : input.windows())
      db.update(
          "INSERT INTO availability(broker_id,weekday,start_hour,end_hour) VALUES (?,?,?,?)",
          input.broker_id(),
          win.weekday(),
          win.start_hour(),
          win.end_hour());
    db.audit(access.id(), "SCHEDULE", "user", input.broker_id(), input.windows().toString());
  }

  @PostMapping("/blocks")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void block(@Valid @RequestBody Block b) {
    broker(b.broker_id());
    if (b.property_id() != null) {
      properties.lock(b.property_id());
      var p = properties.raw(b.property_id());
      access.property(p);
      if (Db.id(p, "broker_id") != b.broker_id()) throw new Fault(400, "Imóvel de outro corretor.");
    }
    db.one("SELECT id FROM users WHERE id=? FOR UPDATE", b.broker_id());
    if (!b.ends_at().isAfter(b.starts_at())) throw new Fault(400, "Intervalo inválido.");
    if (db.count(
            "SELECT COUNT(*) FROM visits WHERE broker_id=? AND starts_at<? AND ends_at>? AND status"
                + " IN ('SCHEDULED','CONFIRMED')",
            b.broker_id(),
            Timestamp.from(b.ends_at()),
            Timestamp.from(b.starts_at()))
        > 0) throw new Fault(409, "Cancele as visitas desse período antes de bloquear.");
    long id =
        db.insert(
            "INSERT INTO calendar_blocks(broker_id,property_id,starts_at,ends_at,reason) VALUES"
                + " (?,?,?,?,?)",
            b.broker_id(),
            b.property_id(),
            Timestamp.from(b.starts_at()),
            Timestamp.from(b.ends_at()),
            b.reason());
    db.audit(access.id(), "BLOCK", "calendar", id, b.reason());
  }

  @DeleteMapping("/blocks/{id}")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void remove(@PathVariable long id) {
    var b = db.one("SELECT * FROM calendar_blocks WHERE id=?", id);
    broker(Db.id(b, "broker_id"));
    db.update("DELETE FROM calendar_blocks WHERE id=?", id);
    db.audit(access.id(), "UNBLOCK", "calendar", id, "Removido");
  }

  @PutMapping("/holidays")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void holiday(@Valid @RequestBody Holiday h) {
    access.adminOnly();
    db.list("SELECT year FROM calendar_years WHERE year=? FOR UPDATE", h.day().getYear());
    db.update(
        "INSERT INTO holidays(day,name) VALUES (?,?) ON DUPLICATE KEY UPDATE name=?",
        h.day(),
        h.name(),
        h.name());
    db.audit(access.id(), "HOLIDAY", "calendar", h.day().getYear(), h.toString());
  }

  @DeleteMapping("/holidays/{day}")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void removeHoliday(@PathVariable LocalDate day) {
    access.adminOnly();
    db.list("SELECT year FROM calendar_years WHERE year=? FOR UPDATE", day.getYear());
    db.update("DELETE FROM holidays WHERE day=?", day);
    db.audit(access.id(), "REMOVE_HOLIDAY", "calendar", day.getYear(), day.toString());
  }

  @PutMapping("/years/{year}")
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void cover(@PathVariable int year) {
    access.adminOnly();
    if (year < 2026 || year > 2100) throw new Fault(400, "Ano inválido.");
    db.update("INSERT IGNORE INTO calendar_years(year) VALUES (?)", year);
    db.audit(
        access.id(),
        "COVER_YEAR",
        "calendar",
        year,
        "Calendário anual revisado pelo administrador");
  }
}
