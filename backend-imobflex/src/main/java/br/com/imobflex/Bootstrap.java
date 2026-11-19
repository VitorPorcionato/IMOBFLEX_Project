package br.com.imobflex;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@org.springframework.core.annotation.Order(10)
class Bootstrap implements ApplicationRunner {
  final Db db;
  final AuthService auth;
  final String email, password;

  Bootstrap(
      Db db,
      AuthService auth,
      @Value("${app.bootstrap-email}") String email,
      @Value("${app.bootstrap-password}") String password) {
    this.db = db;
    this.auth = auth;
    this.email = email;
    this.password = password;
  }

  public void run(ApplicationArguments args) {
    if (db.count("SELECT COUNT(*) FROM users WHERE role='ADMIN'") == 0 && !email.isBlank()) {
      AuthService.password(password);
      db.update(
          "INSERT INTO users(name,cpf,email,phone,address,password_hash,role,confirmed) VALUES"
              + " (?,?,?,?,?,?, 'ADMIN',TRUE)",
          "Administrador inicial",
          "00000000000",
          email.strip().toLowerCase(java.util.Locale.ROOT),
          "Configurar",
          "Configurar",
          auth.encode(password));
    }
  }
}
