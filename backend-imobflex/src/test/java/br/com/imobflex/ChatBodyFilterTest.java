package br.com.imobflex;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;

class ChatBodyFilterTest {
  @Test
  void oversizedJsonIsRejectedBeforeCallingTheApplication() throws Exception {
    var request = new MockHttpServletRequest("POST", "/api/v1/public/chat");
    request.setContent(new byte[8193]);
    var response = new MockHttpServletResponse();
    var chain = new MockFilterChain();
    new ChatBodyFilter().doFilter(request, response, chain);
    assertEquals(413, response.getStatus());
    assertNull(chain.getRequest());
  }

  @Test
  void validBodyIsStillReadableByMvc() throws Exception {
    var request = new MockHttpServletRequest("POST", "/api/v1/public/chat");
    request.setContent(
        "{\"message\":\"visita\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
    var response = new MockHttpServletResponse();
    var chain = new MockFilterChain();
    new ChatBodyFilter().doFilter(request, response, chain);
    assertEquals(200, response.getStatus());
    assertNotNull(chain.getRequest());
    assertTrue(new String(chain.getRequest().getInputStream().readAllBytes()).contains("visita"));
  }
}
