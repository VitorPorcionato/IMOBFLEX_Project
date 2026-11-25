package br.com.imobflex;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.boot.*;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** One-time refresh of untouched demo records and twelve additional examples. */
@Component
@Profile("demo")
@Order(40)
class CuratedDemoSeeder implements ApplicationRunner {
  private static final String MARKER = "DEMO_CURATED_SP_25";
  private static final String ORIGINAL_DESCRIPTION =
      "ANÚNCIO FICTÍCIO PARA DEMONSTRAÇÃO. Fotografias ilustrativas, sem vínculo com um imóvel"
          + " real. Ambientes amplos e iluminados, espaços integrados e localização usada apenas"
          + " para testar busca, contato e agendamento.";
  private final Db db;
  private final ImageStorage images;

  CuratedDemoSeeder(Db db, ImageStorage images) {
    this.db = db;
    this.images = images;
  }

  @Transactional(rollbackFor = Exception.class)
  public void run(ApplicationArguments args) throws Exception {
    var owners =
        db.list(
            "SELECT id FROM users WHERE email='proprietario@example.test' AND role='OWNER' FOR"
                + " UPDATE");
    if (owners.isEmpty() || db.count("SELECT COUNT(*) FROM audit WHERE action=?", MARKER) > 0)
      return;
    var brokers =
        db.list("SELECT id FROM users WHERE email='corretor@example.test' AND role='BROKER'");
    if (brokers.isEmpty()) return;
    long owner = Db.id(owners.getFirst(), "id"), broker = Db.id(brokers.getFirst(), "id");
    var oldDescriptions = new HashMap<String, String>();
    for (String[] row : rows("demo/properties.tsv")) {
      oldDescriptions.put(
          row[0],
          "ANÚNCIO FICTÍCIO PARA DEMONSTRAÇÃO. Endereço e fotografias ilustrativos, sem vínculo com"
              + " oferta real. "
              + row[3]);
    }
    var catalog = rows("demo/curated/properties.tsv");
    if (catalog.size() != 25 || catalog.stream().anyMatch(p -> p.length != 17))
      throw new IllegalStateException("Invalid curated demo catalog");
    int added = 0, refreshed = 0;
    for (int i = 0; i < catalog.size(); i++) {
      String[] p = catalog.get(i);
      Long id = null;
      if (!p[16].isBlank()) {
        // A changed title, description, address or ownership belongs to the user.
        var existing =
            db.list(
                "SELECT id,street FROM properties WHERE owner_id=? AND title=? AND description=?"
                    + " FOR UPDATE",
                owner,
                p[16],
                oldDescriptions.getOrDefault(p[16], ORIGINAL_DESCRIPTION));
        if (existing.size() != 1) continue;
        var found = existing.getFirst();
        String oldStreet = "Rua de demonstração";
        for (String[] old : rows("demo/properties.tsv"))
          if (old[0].equals(p[16])) oldStreet = old[5];
        if (!oldStreet.equals(found.get("street"))) continue;
        id = Db.id(found, "id");
        if (db.count(
                "SELECT COUNT(*) FROM audit WHERE resource_type='property' AND resource_id=? AND"
                    + " actor_id IS NOT NULL",
                id)
            > 0) continue;
      }
      var values =
          new ArrayList<Object>(
              Arrays.asList(
                  p[0],
                  p[1],
                  p[2],
                  "ANÚNCIO FICTÍCIO PARA DEMONSTRAÇÃO. Fotografias ilustrativas, sem vínculo com"
                      + " uma oferta real. "
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
                  Integer.parseInt(p[15])));
      if (id == null) {
        values.add(owner);
        values.add(broker);
        id =
            db.insert(
                "INSERT INTO"
                    + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,rent_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)"
                    + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'AVAILABLE')",
                values.toArray());
        added++;
      } else {
        values.add(id);
        db.update(
            "UPDATE properties SET"
                + " title=?,type=?,purpose=?,description=?,cep=?,street=?,number=?,neighborhood=?,city=?,state=?,sale_price=?,rent_price=?,area=?,bedrooms=?,bathrooms=?,parking=?"
                + " WHERE id=?",
            values.toArray());
        db.update("DELETE FROM property_images WHERE property_id=?", id);
        refreshed++;
      }
      try (var stream =
          new ClassPathResource("demo/curated/cover-%02d.jpg".formatted(i)).getInputStream()) {
        var photo = ImageIO.read(stream);
        if (photo == null) throw new IOException("Invalid bundled demo photograph");
        for (int j = 0; j < 3; j++) {
          // Each listing owns its photograph; extra frames are detail crops of that image.
          var frame =
              j == 0
                  ? photo
                  : photo.getSubimage(
                      j == 1 ? 0 : photo.getWidth() / 3,
                      0,
                      photo.getWidth() * 2 / 3,
                      photo.getHeight());
          String path = images.save(Images.resize(frame, 1280));
          String thumbnail = images.save(Images.resize(frame, 640));
          db.update(
              "INSERT INTO property_images(property_id,path,thumbnail,position) VALUES (?,?,?,?)",
              id,
              path,
              thumbnail,
              j);
        }
      }
    }
    db.audit(
        null,
        MARKER,
        "system",
        0,
        added
            + " exemplos adicionados; "
            + refreshed
            + " exemplos originais atualizados; localidades SP verificadas no ViaCEP");
  }

  private static List<String[]> rows(String resource) throws IOException {
    try (var reader =
        new BufferedReader(
            new InputStreamReader(
                new ClassPathResource(resource).getInputStream(), StandardCharsets.UTF_8))) {
      return reader
          .lines()
          .skip(1)
          .filter(line -> !line.isBlank())
          .map(line -> line.split("\t", -1))
          .toList();
    }
  }

  private static BigDecimal decimal(String value) {
    return value.isBlank() ? null : new BigDecimal(value);
  }
}
