package br.com.imobflex;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class RulesTest {
  @Test
  void cpfValidatesDigitsAndRejectsRepeatedValues() {
    assertTrue(Cpf.valid("529.982.247-25"));
    assertFalse(Cpf.valid("52998224724"));
    assertFalse(Cpf.valid("11111111111"));
    assertFalse(Cpf.valid(null));
  }

  @Test
  void advanceUsesExact24HourBoundary() {
    Instant now = Instant.parse("2026-10-13T12:00:00Z");
    assertFalse(VisitService.advance(now.plusSeconds(86399), now));
    assertTrue(VisitService.advance(now.plusSeconds(86400), now));
  }

  @Test
  void passwordRejectsWeakAndOversizedUtf8() {
    assertThrows(Fault.class, () -> AuthService.password("short"));
    assertThrows(Fault.class, () -> AuthService.password("NoNumbers"));
    assertThrows(Fault.class, () -> AuthService.password("A1" + "á".repeat(40)));
    assertDoesNotThrow(() -> AuthService.password("PilotSecure25"));
  }
}
