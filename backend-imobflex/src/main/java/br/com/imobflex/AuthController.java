package br.com.imobflex;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class AuthController {
  final AuthService auth;
  final Db db;
  final Access access;
  final HttpSessionSecurityContextRepository contexts;

  AuthController(
      AuthService auth, Db db, Access access, HttpSessionSecurityContextRepository contexts) {
    this.auth = auth;
    this.db = db;
    this.access = access;
    this.contexts = contexts;
  }

  record Login(@NotBlank @Email String email, @NotBlank String password) {}

  record EmailInput(@Email @NotBlank String email) {}

  record Token(@NotBlank String token, String password) {}

  @GetMapping("/auth/csrf")
  Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @PostMapping("/auth/register")
  Map<String, String> register(
      @Valid @RequestBody AuthService.Registration r, HttpServletRequest request) {
    new PrivacyService(db, null).rate("signup:" + request.getRemoteAddr());
    auth.register(r, "CLIENT");
    return Map.of("message", "Cadastro recebido. Confirme seu e-mail para entrar.");
  }

  @PostMapping("/auth/login")
  Map<String, Object> login(
      @Valid @RequestBody Login r, HttpServletRequest request, HttpServletResponse response) {
    var rows =
        db.list("SELECT * FROM users WHERE email=?", r.email().strip().toLowerCase(Locale.ROOT));
    if (rows.isEmpty()) {
      auth.matches(r.password(), "$2a$12$9CvbRVKJsBhXXFWML.lRie2XV07bmFLrLWjgGK0c7KRzWNPhLY.oS");
      throw new Fault(401, "E-mail ou senha inválidos.");
    }
    var u = rows.getFirst();
    long id = Db.id(u, "id");
    if (u.get("locked_until") != null
        && Instant.parse((String) u.get("locked_until")).isAfter(Instant.now()))
      throw new Fault(429, "Conta bloqueada por 15 minutos.");
    if (!auth.matches(r.password(), (String) u.get("password_hash"))) {
      db.update(
          "UPDATE users SET failed_logins=IF(locked_until IS NOT NULL AND"
              + " locked_until<=CURRENT_TIMESTAMP(6),1,failed_logins+1),locked_until=IF(failed_logins>=5,TIMESTAMPADD(MINUTE,15,CURRENT_TIMESTAMP(6)),NULL)"
              + " WHERE id=?",
          id);
      db.audit(id, "LOGIN_FAILURE", "user", id, "Autenticação");
      throw new Fault(401, "E-mail ou senha inválidos.");
    }
    if (!Db.yes(u.get("active")) || !Db.yes(u.get("confirmed")) || u.get("role").equals("OWNER"))
      throw new Fault(403, "Confirme seu e-mail e verifique se a conta possui acesso ao portal.");
    db.update(
        "UPDATE users SET"
            + " last_active_at=CURRENT_TIMESTAMP(6),inactivity_warned_at=NULL,failed_logins=0,locked_until=NULL"
            + " WHERE id=?",
        id);
    request.getSession();
    request.changeSessionId();
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(
            Long.toString(id), null, List.of(new SimpleGrantedAuthority("ROLE_" + u.get("role")))));
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    db.audit(id, "LOGIN", "user", id, "Autenticação");
    return auth.publicUser(id);
  }

  @PostMapping("/auth/forgot-password")
  Map<String, String> forgot(@Valid @RequestBody EmailInput e) {
    auth.requestToken(e.email(), "RESET");
    return Map.of("message", "Se a conta estiver ativa, você receberá um link por e-mail.");
  }

  @PostMapping("/auth/resend-confirmation")
  Map<String, String> resend(@Valid @RequestBody EmailInput e) {
    auth.requestToken(e.email(), "CONFIRM");
    return Map.of("message", "Se a conta estiver ativa, você receberá um link por e-mail.");
  }

  @PostMapping("/auth/confirm")
  void confirm(@Valid @RequestBody Token t) {
    auth.consume(t.token(), "CONFIRM", null);
  }

  @PostMapping("/auth/reset-password")
  void reset(@Valid @RequestBody Token t) {
    auth.consume(t.token(), "RESET", t.password());
  }

  @GetMapping("/me")
  Map<String, Object> me() {
    return auth.publicUser(access.id());
  }
}
