package br.com.imobflex;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.io.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
class PropertyController {
  final PropertyService service;
  final Db db;
  final Access access;
  final Images images;
  final ImageStorage storage;

  PropertyController(
      PropertyService service, Db db, Access access, Images images, ImageStorage storage) {
    this.service = service;
    this.db = db;
    this.access = access;
    this.images = images;
    this.storage = storage;
  }

  @GetMapping("/public/properties")
  Map<String, Object> search(@RequestParam Map<String, String> params) {
    return service.search(params);
  }

  @GetMapping("/public/properties/{id}")
  Map<String, Object> detail(@PathVariable long id) {
    return service.detail(id, false);
  }

  @GetMapping("/properties")
  List<Map<String, Object>> manage() {
    access.staff();
    return db.list(
        "SELECT p.*,(SELECT thumbnail FROM property_images WHERE property_id=p.id ORDER BY position"
            + " LIMIT 1) cover FROM properties p"
            + (access.admin() ? "" : " WHERE p.broker_id=" + access.id())
            + " ORDER BY p.id DESC");
  }

  @GetMapping("/properties/{id}")
  Map<String, Object> internal(@PathVariable long id) {
    return service.detail(id, true);
  }

  @PostMapping("/properties")
  Map<String, Long> create(@Valid @RequestBody PropertyService.Input input) {
    return Map.of("id", service.create(input));
  }

  @PutMapping("/properties/{id}")
  void edit(@PathVariable long id, @Valid @RequestBody PropertyService.Input input) {
    service.edit(id, input);
  }

  record Status(@NotBlank String status) {}

  @PatchMapping("/properties/{id}/status")
  void status(@PathVariable long id, @Valid @RequestBody Status input) {
    service.status(id, input.status());
  }

  @DeleteMapping("/properties/{id}")
  void delete(@PathVariable long id) {
    service.delete(id);
  }

  @PostMapping("/properties/{id}/images")
  void upload(@PathVariable long id, @RequestParam("files") MultipartFile[] files)
      throws IOException {
    images.upload(id, files);
  }

  @PutMapping("/properties/{id}/images/{image}/cover")
  void cover(@PathVariable long id, @PathVariable long image) {
    images.cover(id, image);
  }

  @DeleteMapping("/properties/{id}/images/{image}")
  void deleteImage(@PathVariable long id, @PathVariable long image) {
    images.remove(id, image);
  }

  @GetMapping("/public/images/{name}")
  ResponseEntity<byte[]> image(@PathVariable String name) throws IOException {
    if (db.count(
            "SELECT COUNT(*) FROM property_images i JOIN properties p ON p.id=i.property_id WHERE"
                + " (i.path=? OR i.thumbnail=?) AND p.status IN ('AVAILABLE','NEGOTIATING')",
            name,
            name)
        == 0) {
      var row =
          db.one(
              "SELECT p.* FROM properties p JOIN property_images i ON p.id=i.property_id WHERE"
                  + " i.path=? OR i.thumbnail=?",
              name,
              name);
      access.property(row);
    }
    try {
      return ResponseEntity.ok()
          .contentType(MediaType.IMAGE_JPEG)
          .cacheControl(CacheControl.noStore())
          .body(storage.read(name));
    } catch (java.nio.file.NoSuchFileException e) {
      throw new Fault(404, "Imagem indisponível.");
    }
  }
}
