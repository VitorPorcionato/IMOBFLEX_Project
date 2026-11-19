package br.com.imobflex;

import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
class HealthController {
  final Db db;

  HealthController(Db db) {
    this.db = db;
  }

  @GetMapping("/health")
  Map<String, String> health() {
    db.count("SELECT 1");
    return Map.of("status", "UP");
  }

  @GetMapping("/openapi")
  ResponseEntity<ClassPathResource> openapi() {
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/yaml"))
        .body(new ClassPathResource("openapi.yaml"));
  }
}
