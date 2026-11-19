package br.com.imobflex;

import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.*;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
@Order(20)
class DemoSeeder implements ApplicationRunner {
  final Db db;
  final AuthService auth;
  final ImageStorage images;
  final String password;

  DemoSeeder(
      Db db, AuthService auth, ImageStorage images, @Value("${DEMO_PASSWORD:}") String password) {
    this.db = db;
    this.auth = auth;
    this.images = images;
    this.password = password;
  }

  @Transactional(
      isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED,
      rollbackFor = Exception.class)
  public void run(ApplicationArguments args) throws Exception {
    if (db.count("SELECT COUNT(*) FROM properties") > 0) return;
    AuthService.password(password);
    String hash = auth.encode(password);
    long broker =
        db.insert(
            "INSERT INTO users(name,cpf,email,phone,address,password_hash,role,confirmed) VALUES"
                + " ('Corretora"
                + " demonstração','11144477735','corretor@example.test','11999990001','Endereço"
                + " fictício',?,'BROKER',TRUE)",
            hash);
    long owner =
        db.insert(
            "INSERT INTO users(name,cpf,email,phone,address,password_hash,role,confirmed) VALUES"
                + " ('Proprietário"
                + " demonstração','93541134780','proprietario@example.test','11999990002','Endereço"
                + " fictício',?,'OWNER',TRUE)",
            hash);
    db.update(
        "INSERT INTO users(name,cpf,email,phone,address,password_hash,role,confirmed) VALUES"
            + " ('Cliente"
            + " demonstração','52998224725','cliente@example.test','11999990003','Endereço"
            + " fictício',?,'CLIENT',TRUE)",
        hash);
    String[] titles = {
      "Casa com jardim e espaços integrados",
      "Apartamento para viver com conforto",
      "Seu novo espaço perto de tudo"
    };
    String[] neighborhoods = {"Santa Paula", "Centro", "Cerâmica"};
    String[] types = {"HOUSE", "APARTMENT", "APARTMENT"};
    String[] covers = new String[3], thumbs = new String[3];
    for (int i = 0; i < 3; i++) {
      byte[] bytes =
          new ClassPathResource("demo/photo-" + i + ".jpg").getInputStream().readAllBytes();
      covers[i] = images.save(bytes);
      thumbs[i] =
          images.save(
              Images.resize(
                  javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(bytes)), 640));
    }
    for (int i = 0; i < 3; i++) {
      long id =
          db.insert(
              "INSERT INTO"
                  + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,rent_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)"
                  + " VALUES (?,?,'BOTH',?,'09500000','Rua de demonstração','100',?,'São Caetano do"
                  + " Sul','SP',?,?,?,3,2,2,?,?,'AVAILABLE')",
              titles[i],
              types[i],
              "ANÚNCIO FICTÍCIO PARA DEMONSTRAÇÃO. Fotografias ilustrativas, sem vínculo com um"
                  + " imóvel real. Ambientes amplos e iluminados, espaços integrados e localização"
                  + " usada apenas para testar busca, contato e agendamento.",
              neighborhoods[i],
              850000 + i * 75000,
              3500 + i * 400,
              120 + i * 25,
              owner,
              broker);
      for (int j = 0; j < 3; j++)
        db.update(
            "INSERT INTO property_images(property_id,path,thumbnail,position) VALUES (?,?,?,?)",
            id,
            covers[(j + i) % 3],
            thumbs[(j + i) % 3],
            j);
    }
    for (int day = 1; day <= 6; day++)
      db.update(
          "INSERT INTO availability(broker_id,weekday,start_hour,end_hour) VALUES (?,?,9,18)",
          broker,
          day);
    db.audit(
        null,
        "DEMO_SEED",
        "system",
        0,
        "Dados fictícios inseridos explicitamente pelo perfil demo");
  }
}
