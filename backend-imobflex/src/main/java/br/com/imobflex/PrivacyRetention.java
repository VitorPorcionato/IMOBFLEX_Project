package br.com.imobflex;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PrivacyRetention {
  final Db db;
  final PrivacyService privacy;
  final boolean enabled;

  PrivacyRetention(
      Db db, PrivacyService p, @Value("${PRIVACY_RETENTION_ENABLED:false}") boolean e) {
    this.db = db;
    privacy = p;
    enabled = e;
  }

  boolean isEnabled() {
    return enabled;
  }

  Map<String, Object> report() {
    return Map.of(
        "legacy_profile_fields",
        db.count("SELECT COUNT(*) FROM users WHERE cpf IS NOT NULL OR address IS NOT NULL"),
        "expired_identity",
        db.count("SELECT COUNT(*) FROM visit_identity WHERE expires_at<=CURRENT_TIMESTAMP(6)"),
        "old_contacts",
        db.count(
            "SELECT COUNT(*) FROM contacts c WHERE GREATEST(c.created_at,COALESCE((SELECT"
                + " MAX(created_at) FROM messages WHERE"
                + " contact_id=c.id),c.created_at))<TIMESTAMPADD(DAY,-180,CURRENT_TIMESTAMP(6))"),
        "enabled",
        enabled);
  }

  @Scheduled(fixedDelay = 60000)
  @Transactional
  public void purgeIdentity() {
    db.update(
        "DELETE i FROM visit_identity i JOIN visits v ON v.id=i.visit_id WHERE"
            + " i.expires_at<=TIMESTAMPADD(MINUTE,1,CURRENT_TIMESTAMP(6)) OR v.status='CANCELLED'");
  }

  @Scheduled(cron = "0 15 3 * * *", zone = "America/Sao_Paulo")
  @Transactional
  public void clean() {
    if (enabled) cleanAt(Instant.now());
  }

  @Scheduled(cron = "0 0 * * * *", zone = "America/Sao_Paulo")
  @Transactional
  public void remind() {
    for (var i :
        db.list(
            "SELECT id,due_at FROM privacy_incidents WHERE reportable=TRUE AND (anpd_protocol IS"
                + " NULL OR holders_notice IS NULL)")) {
      long id = Db.id(i, "id");
      if (db.count(
              "SELECT COUNT(*) FROM audit WHERE action='INCIDENT_REMINDER' AND resource_id=? AND"
                  + " created_at> TIMESTAMPADD(HOUR,-24,CURRENT_TIMESTAMP(6))",
              id)
          > 0) continue;
      for (var a : db.list("SELECT id FROM users WHERE role='ADMIN' AND active=TRUE"))
        privacy.notifyUser(
            Db.id(a, "id"),
            "Incidente #" + id + ": comunicação pendente. Prazo: " + i.get("due_at"));
      db.audit(null, "INCIDENT_REMINDER", "incident", id, "Lembrete ao responsável");
    }
  }

  void cleanAt(Instant now) {
    Timestamp time = Timestamp.from(now);
    db.update("UPDATE users SET cpf=NULL,address=NULL");
    db.update("DELETE FROM search_terms");
    db.update(
        "UPDATE audit SET details='Conteúdo pessoal removido' WHERE action='EDIT' AND"
            + " resource_type='property'");
    db.update(
        "DELETE i FROM visit_identity i JOIN visits v ON v.id=i.visit_id WHERE i.expires_at<=? OR"
            + " v.status='CANCELLED'",
        time);
    db.update(
        "DELETE m FROM messages m JOIN contacts c ON c.id=m.contact_id WHERE"
            + " GREATEST(c.created_at,COALESCE((SELECT latest FROM (SELECT"
            + " contact_id,MAX(created_at) latest FROM messages GROUP BY contact_id) x WHERE"
            + " x.contact_id=c.id),c.created_at))<TIMESTAMPADD(DAY,-180,?)",
        time);
    db.update(
        "DELETE FROM contacts WHERE created_at<TIMESTAMPADD(DAY,-180,?) AND NOT EXISTS(SELECT 1"
            + " FROM messages WHERE contact_id=contacts.id)",
        time);
    db.update(
        "DELETE i FROM visit_identity i JOIN visits v ON v.id=i.visit_id WHERE"
            + " v.ends_at<TIMESTAMPADD(DAY,-180,?)",
        time);
    db.update("UPDATE visits SET client_id=NULL WHERE ends_at<TIMESTAMPADD(DAY,-180,?)", time);
    db.update("DELETE FROM account_tokens WHERE used=TRUE OR expires_at<=?", time);
    db.update("DELETE FROM privacy_tokens WHERE expires_at<=?", time);
    db.update("DELETE FROM privacy_rate_limits WHERE expires_at<=?", time);
    db.update(
        "DELETE FROM outbox WHERE COALESCE(completed_at,created_at)<TIMESTAMPADD(DAY,-30,?) AND"
            + " status IN ('SENT','FAILED','CANCELLED')",
        time);
    db.update("DELETE FROM legal_acceptances WHERE expires_at<=?", time);
    db.update(
        "DELETE e FROM marketing_events e JOIN marketing_preferences p ON p.user_id=e.user_id WHERE"
            + " p.allowed=FALSE AND p.updated_at<TIMESTAMPADD(MONTH,-12,?)",
        time);
    db.update(
        "DELETE FROM marketing_preferences WHERE allowed=FALSE AND"
            + " updated_at<TIMESTAMPADD(MONTH,-12,?)",
        time);
    db.update("DELETE FROM privacy_requests WHERE completed_at<TIMESTAMPADD(MONTH,-12,?)", time);
    for (var u :
        db.list(
            "SELECT id,email,inactivity_warned_at FROM users WHERE (active=TRUE OR"
                + " password_hash<>'REVOKED') AND role='CLIENT' AND"
                + " last_active_at<TIMESTAMPADD(MONTH,-12,?)",
            time)) {
      long id = Db.id(u, "id");
      String email = (String) u.get("email");
      if (u.get("inactivity_warned_at") == null) {
        privacy.send(
            email,
            "Sua conta está inativa",
            "Entre nos próximos 30 dias para manter sua conta. Você também pode solicitar exclusão"
                + " na Central de Privacidade.");
        db.update("UPDATE users SET inactivity_warned_at=? WHERE id=?", time, id);
      } else if (Instant.parse((String) u.get("inactivity_warned_at"))
              .plusSeconds(30L * 86400)
              .isBefore(now)
          && privacy.hold(id) == null) {
        privacy.marketing(id, false);
        privacy.erase(email, id);
      }
    }
    db.update(
        "INSERT INTO privacy_retention_runs(summary) VALUES ('Limpeza diária concluída, sem"
            + " conteúdo pessoal no relatório')");
  }
}
