package br.com.imobflex;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.*;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Explicit demo-only catalog expansion; preserves existing properties and user edits. */
@Component
@Profile("demo")
@Order(30)
class ExpandedDemoSeeder implements ApplicationRunner {
  private final Db db;
  private final ImageStorage images;

  ExpandedDemoSeeder(Db db, ImageStorage images) {
    this.db = db;
    this.images = images;
  }

  @Transactional(rollbackFor = Exception.class)
  public void run(ApplicationArguments args) throws Exception {
    // The account lock serializes concurrent demo starts before checking the marker.
    var brokers =
        db.list(
            "SELECT id FROM users WHERE email='corretor@example.test' AND role='BROKER' FOR"
                + " UPDATE");
    if (brokers.isEmpty()) return;
    if (db.count("SELECT COUNT(*) FROM audit WHERE action='DEMO_CATALOG_10'") > 0) return;
    var owners =
        db.list("SELECT id FROM users WHERE email='proprietario@example.test' AND role='OWNER'");
    if (owners.isEmpty()) return;
    long broker = Db.id(brokers.getFirst(), "id"), owner = Db.id(owners.getFirst(), "id");
    String[] photos = new String[3], thumbnails = new String[3];
    for (int i = 0; i < 3; i++) {
      try (var stream = new ClassPathResource("demo/photo-" + i + ".jpg").getInputStream()) {
        byte[] bytes = stream.readAllBytes();
        photos[i] = images.save(bytes);
        thumbnails[i] =
            images.save(
                Images.resize(javax.imageio.ImageIO.read(new ByteArrayInputStream(bytes)), 640));
      }
    }
    try (var reader =
        new BufferedReader(
            new InputStreamReader(
                new ClassPathResource("demo/properties.tsv").getInputStream(),
                StandardCharsets.UTF_8))) {
      reader.readLine();
      String line;
      int index = 0;
      while ((line = reader.readLine()) != null) {
        if (line.isBlank()) continue;
        String[] p = line.split("\t", -1);
        if (p.length != 16) throw new IllegalStateException("Invalid demo property row");
        long id =
            db.insert(
                "INSERT INTO"
                    + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,rent_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)"
                    + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'AVAILABLE')",
                p[0],
                p[1],
                p[2],
                "ANÚNCIO FICTÍCIO PARA DEMONSTRAÇÃO. Endereço e fotografias ilustrativos, sem"
                    + " vínculo com oferta real. "
                    + p[3],
                p[4],
                p[5],
                p[6],
                p[7],
                p[8],
                p[9],
                decimal(p[10]),
                decimal(p[11]),
                decimal(p[12]),
                Integer.parseInt(p[13]),
                Integer.parseInt(p[14]),
                Integer.parseInt(p[15]),
                owner,
                broker);
        for (int j = 0; j < 3; j++) {
          int photo = (index + j) % 3;
          db.update(
              "INSERT INTO property_images(property_id,path,thumbnail,position) VALUES (?,?,?,?)",
              id,
              photos[photo],
              thumbnails[photo],
              j);
        }
        index++;
      }
      if (index != 10) throw new IllegalStateException("Expected exactly ten demo properties");
    }
    db.audit(
        null, "DEMO_CATALOG_10", "system", 0, "Dez imóveis fictícios adicionados pelo perfil demo");
  }

  private BigDecimal decimal(String value) {
    return value.isBlank() ? null : new BigDecimal(value);
  }
}
