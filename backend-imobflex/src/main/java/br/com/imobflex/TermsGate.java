package br.com.imobflex;

import jakarta.servlet.http.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
class TermsGate implements WebMvcConfigurer {
  final PrivacyService privacy;

  TermsGate(PrivacyService p) {
    privacy = p;
  }

  public void addInterceptors(InterceptorRegistry r) {
    r.addInterceptor(
        new HandlerInterceptor() {
          public boolean preHandle(HttpServletRequest q, HttpServletResponse s, Object handler) {
            String path = q.getRequestURI();
            var a = SecurityContextHolder.getContext().getAuthentication();
            if (!java.util.Set.of("GET", "HEAD", "OPTIONS").contains(q.getMethod())
                && path.startsWith("/api/v1/")
                && !path.startsWith("/api/v1/auth/")
                && !path.startsWith("/api/v1/privacy/")
                && !path.startsWith("/api/v1/public/")
                && !path.startsWith("/api/v1/admin/privacy/")
                && !path.equals("/api/v1/logout")
                && !path.equals("/api/v1/me")
                && a != null
                && !a.getName().equals("anonymousUser"))
              privacy.requireTerms(Long.parseLong(a.getName()));
            return true;
          }
        });
  }
}
