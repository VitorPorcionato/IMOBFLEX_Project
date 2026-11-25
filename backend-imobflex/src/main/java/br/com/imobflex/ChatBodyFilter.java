package br.com.imobflex;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Bound JSON before deserialization, including chunked requests. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ChatBodyFilter extends OncePerRequestFilter {
  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    return !request.getMethod().equals("POST")
        || !request.getRequestURI().equals("/api/v1/public/chat");
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    byte[] bytes = request.getInputStream().readNBytes(8193);
    if (bytes.length > 8192) {
      response.setStatus(413);
      response.setContentType("application/problem+json");
      response.setCharacterEncoding("UTF-8");
      response
          .getWriter()
          .write("{\"status\":413,\"detail\":\"A pergunta excede o limite permitido.\"}");
      return;
    }
    chain.doFilter(
        new HttpServletRequestWrapper(request) {
          @Override
          public ServletInputStream getInputStream() {
            var body = new ByteArrayInputStream(bytes);
            return new ServletInputStream() {
              @Override
              public int read() {
                return body.read();
              }

              @Override
              public boolean isFinished() {
                return body.available() == 0;
              }

              @Override
              public boolean isReady() {
                return true;
              }

              @Override
              public void setReadListener(ReadListener listener) {
                throw new UnsupportedOperationException("Synchronous endpoint");
              }
            };
          }

          @Override
          public BufferedReader getReader() {
            return new BufferedReader(
                new InputStreamReader(getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
          }
        },
        response);
  }
}
