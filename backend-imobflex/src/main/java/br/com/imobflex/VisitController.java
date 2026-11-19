package br.com.imobflex;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class VisitController {
  final VisitService service;

  VisitController(VisitService service) {
    this.service = service;
  }

  record Booking(
      @Min(1) long property_id, @NotNull Instant starts_at, @Size(max = 14) String cpf) {}

  @GetMapping("/properties/{id}/slots")
  List<String> slots(@PathVariable long id, @RequestParam LocalDate day) {
    return service.slots(id, day);
  }

  @GetMapping("/visits")
  List<Map<String, Object>> list() {
    return service.list();
  }

  @PostMapping("/visits")
  Map<String, Long> book(@Valid @RequestBody Booking b) {
    return Map.of("id", service.book(b.property_id(), b.starts_at(), b.cpf()));
  }

  @PatchMapping("/visits/{id}/status")
  void status(@PathVariable long id, @Valid @RequestBody PropertyController.Status s) {
    service.status(id, s.status());
  }
}
