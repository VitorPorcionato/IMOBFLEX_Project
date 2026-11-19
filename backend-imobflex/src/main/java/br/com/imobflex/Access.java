package br.com.imobflex;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
class Access {
  final Db db;
  final UserRepository users;

  Access(Db db, UserRepository users) {
    this.db = db;
    this.users = users;
  }

  Map<String, Object> user() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !a.isAuthenticated() || a.getName().equals("anonymousUser"))
      throw new Fault(401, "Entre na sua conta.");
    long id = Long.parseLong(a.getName());
    var account = users.findById(id).orElseThrow(() -> new Fault(401, "Conta indisponível."));
    if (!account.active || !account.confirmed) throw new Fault(401, "Conta indisponível.");
    var u = db.one("SELECT * FROM users WHERE id=?", id);
    if (!Db.yes(u.get("active")) || !Db.yes(u.get("confirmed")))
      throw new Fault(401, "Conta indisponível.");
    return u;
  }

  long id() {
    return Db.id(user(), "id");
  }

  boolean admin() {
    return user().get("role").equals("ADMIN");
  }

  void adminOnly() {
    if (!admin()) throw new Fault(403, "Acesso restrito à administração.");
  }

  void staff() {
    if (!java.util.Set.of("ADMIN", "BROKER").contains(user().get("role")))
      throw new Fault(403, "Acesso restrito à equipe.");
  }

  void property(Map<String, Object> p) {
    staff();
    if (!admin() && Db.id(p, "broker_id") != id())
      throw new Fault(403, "Imóvel atribuído a outro corretor.");
  }
}
