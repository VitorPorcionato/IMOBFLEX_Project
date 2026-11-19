package br.com.imobflex;

import java.io.*;
import java.nio.file.*;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
class LocalImageStorage implements ImageStorage {
  final Path root;

  LocalImageStorage(@Value("${app.uploads}") String dir) throws IOException {
    root = Path.of(dir).toAbsolutePath().normalize();
    Files.createDirectories(root);
  }

  public String save(byte[] bytes) throws IOException {
    String name = UUID.randomUUID() + ".jpg";
    Files.write(root.resolve(name), bytes, StandardOpenOption.CREATE_NEW);
    return name;
  }

  public byte[] read(String name) throws IOException {
    if (!name.matches("[a-f0-9-]{36}\\.jpg")) throw new Fault(404, "Imagem não encontrada.");
    return Files.readAllBytes(root.resolve(name));
  }
}
