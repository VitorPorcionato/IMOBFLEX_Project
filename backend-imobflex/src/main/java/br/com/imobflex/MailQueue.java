package br.com.imobflex;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class MailQueue {
  final Db db;
  final JavaMailSender sender;
  final String from;
  final String publicUrl;

  MailQueue(
      Db db,
      JavaMailSender sender,
      @Value("${app.mail-from}") String from,
      @Value("${app.public-url}") String publicUrl) {
    this.db = db;
    this.sender = sender;
    this.from = from;
    this.publicUrl = publicUrl;
  }

  public String publicUrl() {
    return publicUrl;
  }

  void enqueue(String email, String subject, String body) {
    db.update("INSERT INTO outbox(recipient,subject,body) VALUES (?,?,?)", email, subject, body);
  }

  void notify(long user, String message) {
    db.update("INSERT INTO notifications(user_id,message) VALUES (?,?)", user, message);
    var u = db.one("SELECT email FROM users WHERE id=?", user);
    enqueue((String) u.get("email"), "IMOBFLEX — Atendimento", message);
  }

  @Scheduled(fixedDelay = 10000)
  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void deliver() {
    for (var m :
        db.list(
            "SELECT * FROM outbox WHERE status='PENDING' AND next_attempt<=CURRENT_TIMESTAMP(6)"
                + " ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED")) {
      long id = Db.id(m, "id");
      try {
        if ("MARKETING".equals(m.get("category"))) {
          var preferences =
              db.list(
                  "SELECT p.allowed,u.active,u.confirmed FROM marketing_preferences p JOIN users u"
                      + " ON u.id=p.user_id WHERE u.email=?",
                  m.get("recipient"));
          if (preferences.isEmpty()
              || !Db.yes(preferences.getFirst().get("allowed"))
              || !Db.yes(preferences.getFirst().get("active"))
              || !Db.yes(preferences.getFirst().get("confirmed"))) {
            db.update(
                "UPDATE outbox SET status='CANCELLED',completed_at=CURRENT_TIMESTAMP(6) WHERE id=?",
                id);
            continue;
          }
          // No campaign interface is exposed in the pilot. Promotional fixtures must include their
          // unsubscribe link.
          if (!((String) m.get("body")).contains(publicUrl + "/descadastro?token="))
            throw new IllegalStateException("Missing unsubscribe link");
        }

        var mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo((String) m.get("recipient"));
        mail.setSubject((String) m.get("subject"));
        mail.setText((String) m.get("body"));
        sender.send(mail);
        db.update(
            "UPDATE outbox SET"
                + " status='SENT',completed_at=CURRENT_TIMESTAMP(6),attempts=attempts+1,last_error=NULL"
                + " WHERE id=?",
            id);
      } catch (Exception e) {
        db.update(
            "UPDATE outbox SET attempts=attempts+1,status=CASE WHEN attempts>=5 THEN 'FAILED' ELSE"
                + " 'PENDING'"
                + " END,completed_at=IF(attempts>=5,CURRENT_TIMESTAMP(6),NULL),next_attempt=TIMESTAMPADD(MINUTE,5,CURRENT_TIMESTAMP(6)),last_error='Falha"
                + " no envio SMTP' WHERE id=?",
            id);
      }
    }
  }
}
