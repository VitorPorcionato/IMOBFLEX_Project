package br.com.imobflex;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

@Configuration
class SecurityConfig {
  @Bean
  org.springframework.security.core.userdetails.UserDetailsService noGeneratedUser() {
    return username -> {
      throw new org.springframework.security.core.userdetails.UsernameNotFoundException(
          "Use the session authentication API");
    };
  }

  @Bean
  PasswordEncoder passwords() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  HttpSessionSecurityContextRepository contexts() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, HttpSessionSecurityContextRepository contexts)
      throws Exception {
    http.csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
        .securityContext(c -> c.securityContextRepository(contexts))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(
                        "/api/v1/auth/**", "/api/v1/public/**", "/api/v1/health", "/api/v1/openapi")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            e ->
                e.authenticationEntryPoint(
                        (q, s, x) -> {
                          s.setStatus(401);
                          s.setContentType("application/problem+json");
                          s.getWriter()
                              .write("{\"status\":401,\"detail\":\"Entre na sua conta.\"}");
                        })
                    .accessDeniedHandler(
                        (q, s, x) -> {
                          s.setStatus(403);
                          s.setContentType("application/problem+json");
                          s.getWriter()
                              .write(
                                  "{\"status\":403,\"detail\":\"Acesso negado ou sessão de"
                                      + " formulário expirada.\"}");
                        }))
        .logout(
            l ->
                l.logoutUrl("/api/v1/logout")
                    .logoutSuccessHandler((q, s, a) -> s.setStatus(204))
                    .invalidateHttpSession(true)
                    .deleteCookies("SESSION"));
    return http.build();
  }
}
