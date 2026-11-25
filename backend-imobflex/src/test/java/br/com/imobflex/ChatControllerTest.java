package br.com.imobflex;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.net.http.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import tools.jackson.databind.ObjectMapper;

class ChatControllerTest {
  @Test
  void catalogIsGroundedAndConsentIsRequired() throws Exception {
    var properties = mock(PropertyService.class);
    var http = mock(HttpClient.class);
    when(properties.search(anyMap())).thenReturn(Map.of("total", 7));
    var chat =
        new ChatController(properties, new ObjectMapper(), "unit-test-placeholder", "model", http);
    var answer =
        chat.answer(
            new ChatController.Question("Quero alugar um imóvel", false), new MockHttpSession());
    assertTrue(answer.reply().contains("7 opções"));
    assertEquals("/imoveis?purpose=RENT", answer.links().getFirst().href());
    assertEquals("LOCAL", answer.mode());
    verifyNoInteractions(http);
  }

  @Test
  void consentAllowsProviderButNeverModelSuppliedLinks() throws Exception {
    var http = mock(HttpClient.class);
    @SuppressWarnings("unchecked")
    HttpResponse<String> response = mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(200);
    when(response.body())
        .thenReturn(
            "{\"choices\":[{\"message\":{\"content\":\"Escolha um horário no anúncio.\"}}]}");
    when(http.send(
            any(HttpRequest.class),
            org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
        .thenReturn(response);
    var chat =
        new ChatController(
            mock(PropertyService.class),
            new ObjectMapper(),
            "unit-test-placeholder",
            "model",
            http);
    var answer =
        chat.answer(
            new ChatController.Question("Como agendar uma visita?", true), new MockHttpSession());
    assertEquals("GROQ", answer.mode());
    assertEquals("/imoveis", answer.links().getFirst().href());
    verify(http)
        .send(
            argThat(
                request ->
                    request.uri().getHost().equals("api.groq.com")
                        && request.timeout().orElseThrow().toSeconds() == 8),
            org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any());
  }

  @Test
  void missingKeyKeepsLocalHelpEvenWithOptIn() {
    var http = mock(HttpClient.class);
    var chat =
        new ChatController(mock(PropertyService.class), new ObjectMapper(), "", "model", http);
    assertEquals(
        "LOCAL",
        chat.answer(
                new ChatController.Question("Como agendar visita?", true), new MockHttpSession())
            .mode());
    verifyNoInteractions(http);
  }

  @Test
  void upstreamFailureHasReadableLocalFallback() throws Exception {
    var http = mock(HttpClient.class);
    when(http.send(any(), any())).thenThrow(new java.io.IOException("private provider detail"));
    var chat =
        new ChatController(
            mock(PropertyService.class),
            new ObjectMapper(),
            "unit-test-placeholder",
            "model",
            http);
    var answer =
        chat.answer(
            new ChatController.Question("Como agendar uma visita?", true), new MockHttpSession());
    assertEquals("LOCAL", answer.mode());
    assertFalse(answer.reply().contains("private"));
  }

  @Test
  void personalDataAndExcessRequestsAreRejected() {
    var chat =
        new ChatController(
            mock(PropertyService.class), new ObjectMapper(), "", "model", mock(HttpClient.class));
    assertEquals(
        400,
        assertThrows(
                Fault.class,
                () ->
                    chat.answer(
                        new ChatController.Question("Meu CPF é 123.456.789-00", true),
                        new MockHttpSession()))
            .status);
    var session = new MockHttpSession();
    for (int i = 0; i < 10; i++)
      chat.answer(new ChatController.Question("Como visitar?", false), session);
    assertEquals(
        429,
        assertThrows(
                Fault.class,
                () -> chat.answer(new ChatController.Question("Como visitar?", false), session))
            .status);
  }
}
