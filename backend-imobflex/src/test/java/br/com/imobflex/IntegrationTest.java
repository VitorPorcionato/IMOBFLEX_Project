package br.com.imobflex;

import static org.junit.jupiter.api.Assertions.*;

import java.net.*;
import java.net.http.*;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.mysql.MySQLContainer;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class IntegrationTest {
  static MySQLContainer mysql;

  @DynamicPropertySource
  static void config(DynamicPropertyRegistry r) {
    String url = System.getenv("TEST_DATABASE_URL");
    if (url == null) {
      mysql = new MySQLContainer("mysql:8.4.9");
      mysql.start();
      r.add("spring.datasource.url", mysql::getJdbcUrl);
      r.add("spring.datasource.username", mysql::getUsername);
      r.add("spring.datasource.password", mysql::getPassword);
    } else {
      r.add("spring.datasource.url", () -> url);
      r.add("spring.datasource.username", () -> System.getenv("TEST_DATABASE_USER"));
      r.add("spring.datasource.password", () -> System.getenv("TEST_DATABASE_PASSWORD"));
    }
    r.add("PRIVACY_ENCRYPTION_KEY", () -> java.util.Base64.getEncoder().encodeToString(new byte[32]));
    r.add("app.bootstrap-email", () -> "");
    r.add("app.bootstrap-password", () -> "");
    r.add("spring.mail.port", () -> 1);
    r.add("app.uploads", () -> System.getProperty("java.io.tmpdir") + "/imobflex-test-images");
  }

  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired ObjectMapper json;

  @Value("${local.server.port}")
  int port;

  static long admin, broker, owner, client, other, property;
  static Instant slot;

  class Browser {
    HttpClient http =
        HttpClient.newBuilder()
            .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
            .build();

    HttpResponse<String> call(String method, String path, Object body) throws Exception {
      var b = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1" + path));
      if (!method.equals("GET")) {
        var csrf =
            http.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/auth/csrf"))
                    .GET()
                    .build(),
                HttpResponse.BodyHandlers.ofString());
        var token = json.readTree(csrf.body());
        b.header(token.get("headerName").asText(), token.get("token").asText());
      }
      b.header("Content-Type", "application/json");
      return http.send(
          b.method(
                  method,
                  body == null
                      ? HttpRequest.BodyPublishers.noBody()
                      : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
              .build(),
          HttpResponse.BodyHandlers.ofString());
    }

    void login(String email) throws Exception {
      var result = call("POST", "/auth/login", Map.of("email", email, "password", "PilotSecure25"));
      assertEquals(200, result.statusCode(), result.body());
    }
  }

  long user(String email, String cpf, String role) {
    long created = db.insert(
        "INSERT INTO users(name,cpf,email,phone,address,password_hash,role,confirmed) VALUES"
            + " (?,?,?,?,?,?,?,TRUE)",
        role,
        cpf,
        email,
        "11999999999",
        "Endereço fictício",
        auth.encode("PilotSecure25"),
        role);
    new PrivacyService(db, null).accept(created, PrivacyService.VERSION);
    return created;
  }

  @Test
  @Order(1)
  void seedAndMigrations() {
    assertTrue(db.count("SELECT COUNT(*) FROM flyway_schema_history WHERE success=TRUE") >= 2);
    String salt = Long.toString(System.nanoTime());
    admin = user("admin" + salt + "@example.test", "10000000001", "ADMIN");
    broker = user("broker@example.test", "10000000002", "BROKER");
    owner = user("owner@example.test", "10000000003", "OWNER");
    client = user("client@example.test", "10000000004", "CLIENT");
    other = user("other@example.test", "10000000005", "CLIENT");
    property =
        db.insert(
            "INSERT INTO"
                + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)"
                + " VALUES ('Casa de teste','HOUSE','SALE',?,'09500000','Rua"
                + " fictícia','10','Centro','São Caetano do"
                + " Sul','SP',500000,100,2,2,1,?,?,'AVAILABLE')",
            "Descrição de imóvel fictício suficientemente longa para testar os fluxos.",
            owner,
            broker);
    var day = LocalDate.now(VisitService.ZONE).plusDays(3);
    while (day.getDayOfWeek() == DayOfWeek.SUNDAY
        || db.count("SELECT COUNT(*) FROM holidays WHERE day=?", day) > 0) day = day.plusDays(1);
    slot = day.atTime(10, 0).atZone(VisitService.ZONE).toInstant();
    db.update("INSERT IGNORE INTO calendar_years(year) VALUES (?)", day.getYear());
    db.update(
        "INSERT INTO availability(broker_id,weekday,start_hour,end_hour) VALUES (?,?,9,18)",
        broker,
        day.getDayOfWeek().getValue());
  }

  @Test
  @Order(2)
  void publicDataDoesNotExposeOwnerOrAddress() throws Exception {
    var res = new Browser().call("GET", "/public/properties/" + property, null);
    assertEquals(200, res.statusCode());
    assertFalse(res.body().contains("owner_id"));
    assertFalse(res.body().contains("street"));
    assertFalse(res.body().contains("password"));
  }

  @Test
  @Order(3)
  void csrfIsRequired() throws Exception {
    var response =
        HttpClient.newHttpClient()
            .send(
                HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/api/v1/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build(),
                HttpResponse.BodyHandlers.ofString());
    assertEquals(403, response.statusCode());
  }

  @Test
  @Order(4)
  void confirmationAndResetTokensAreSingleUse() throws Exception {
    var browser = new Browser();
    var res =
        browser.call(
            "POST",
            "/auth/register",
            Map.of(
                "name",
                "Cliente fictício",
                "cpf",
                "52998224725",
                "email",
                "new@example.test",
                "phone",
                "11999999999",
                "address",
                "Rua fictícia 20",
                "password",
                "PilotSecure25", "terms_accepted",true,"terms_version",PrivacyService.VERSION));
    assertEquals(200, res.statusCode(), res.body());
    var denied =
        browser.call(
            "POST",
            "/auth/login",
            Map.of("email", "new@example.test", "password", "PilotSecure25"));
    assertEquals(403, denied.statusCode());
    String body =
        (String)
            db.one(
                    "SELECT body FROM outbox WHERE recipient='new@example.test' ORDER BY id DESC"
                        + " LIMIT 1")
                .get("body");
    String token = body.substring(body.indexOf("token=") + 6);
    assertEquals(200, browser.call("POST", "/auth/confirm", Map.of("token", token)).statusCode());
    assertEquals(400, browser.call("POST", "/auth/confirm", Map.of("token", token)).statusCode());
    browser.login("new@example.test");
    assertEquals(
        200,
        browser
            .call("POST", "/auth/forgot-password", Map.of("email", "new@example.test"))
            .statusCode());
    body =
        (String)
            db.one(
                    "SELECT body FROM outbox WHERE recipient='new@example.test' ORDER BY id DESC"
                        + " LIMIT 1")
                .get("body");
    token = body.substring(body.indexOf("token=") + 6);
    assertEquals(
        200,
        browser
            .call(
                "POST",
                "/auth/reset-password",
                Map.of("token", token, "password", "AnotherSecure25"))
            .statusCode());
    assertEquals(401, browser.call("GET", "/me", null).statusCode());
    assertEquals(
        400,
        browser
            .call(
                "POST",
                "/auth/reset-password",
                Map.of("token", token, "password", "AnotherSecure25"))
            .statusCode());
  }

  @Test
  @Order(5)
  void simultaneousReservationsHaveOneWinner() throws Exception {
    var a = new Browser();
    a.login("client@example.test");
    var b = new Browser();
    b.login("other@example.test");
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      var gate = new CountDownLatch(1);
      Callable<Integer> ca =
          () -> {
            gate.await();
            return a.call(
                    "POST",
                    "/visits",
                    Map.of("property_id", property, "starts_at", slot.toString()))
                .statusCode();
          };
      Callable<Integer> cb =
          () -> {
            gate.await();
            return b.call(
                    "POST",
                    "/visits",
                    Map.of("property_id", property, "starts_at", slot.toString()))
                .statusCode();
          };
      var fa = executor.submit(ca);
      var fb = executor.submit(cb);
      gate.countDown();
      var codes = new ArrayList<>(List.of(fa.get(), fb.get()));
      Collections.sort(codes);
      assertEquals(List.of(200, 409), codes);
    }
    assertEquals(
        1,
        db.count(
            "SELECT COUNT(*) FROM visits WHERE property_id=? AND starts_at=?",
            property,
            Timestamp.from(slot)));
  }

  @Test
  @Order(6)
  void clientsCannotManagePropertiesOrOtherVisits() throws Exception {
    var browser = new Browser();
    browser.login("client@example.test");
    assertEquals(403, browser.call("GET", "/properties", null).statusCode());
    assertEquals(403, browser.call("GET", "/users", null).statusCode());
    assertEquals(
        403,
        browser
            .call("PATCH", "/properties/" + property + "/status", Map.of("status", "SOLD"))
            .statusCode());
  }

  @Test
  @Order(7)
  void negotiationBlocksNewVisitsAndSaleCancelsExisting() throws Exception {
    var brokerBrowser = new Browser();
    brokerBrowser.login("broker@example.test");
    for (int i = 0; i < 3; i++)
      db.update(
          "INSERT INTO property_images(property_id,path,thumbnail,position) VALUES (?,?,?,?)",
          property,
          "test" + i,
          "thumb" + i,
          i);
    assertEquals(
        200,
        brokerBrowser
            .call("PATCH", "/properties/" + property + "/status", Map.of("status", "NEGOTIATING"))
            .statusCode());
    var c = new Browser();
    c.login("client@example.test");
    assertEquals(
        409,
        c.call(
                "POST",
                "/visits",
                Map.of("property_id", property, "starts_at", slot.plusSeconds(3600).toString()))
            .statusCode());
    assertEquals(
        1,
        db.count(
            "SELECT COUNT(*) FROM visits WHERE property_id=? AND status='SCHEDULED'", property));
    assertEquals(
        200,
        brokerBrowser
            .call("PATCH", "/properties/" + property + "/status", Map.of("status", "SOLD"))
            .statusCode());
    assertEquals(
        1,
        db.count(
            "SELECT COUNT(*) FROM visits WHERE property_id=? AND status='CANCELLED'", property));
    assertEquals(404, c.call("GET", "/public/properties/" + property, null).statusCode());
  }

  @Test
  @Order(8)
  void lockoutAfterFiveFailures() throws Exception {
    var b = new Browser();
    for (int i = 0; i < 5; i++)
      assertEquals(
          401,
          b.call(
                  "POST",
                  "/auth/login",
                  Map.of("email", "other@example.test", "password", "Incorrect123"))
              .statusCode());
    assertEquals(
        429,
        b.call(
                "POST",
                "/auth/login",
                Map.of("email", "other@example.test", "password", "PilotSecure25"))
            .statusCode());
  }

  @Test
  @Order(9)
  void brokerConflictAcrossDifferentProperties() throws Exception {
    db.update("UPDATE users SET locked_until=NULL,failed_logins=0 WHERE id=?", other);
    db.update("UPDATE properties SET status='AVAILABLE' WHERE id=?", property);
    long second =
        db.insert(
            "INSERT INTO"
                + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)"
                + " SELECT 'Segundo"
                + " imóvel','HOUSE','SALE',description,cep,street,number,neighborhood,city,state,sale_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,'AVAILABLE'"
                + " FROM properties WHERE id=?",
            property);
    var a = new Browser();
    a.login("client@example.test");
    var b = new Browser();
    b.login("other@example.test");
    Instant start = slot.plusSeconds(7200);
    try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
      var gate = new CountDownLatch(1);
      var fa =
          executor.submit(
              () -> {
                gate.await();
                return a.call(
                        "POST",
                        "/visits",
                        Map.of("property_id", property, "starts_at", start.toString()))
                    .statusCode();
              });
      var fb =
          executor.submit(
              () -> {
                gate.await();
                return b.call(
                        "POST",
                        "/visits",
                        Map.of("property_id", second, "starts_at", start.toString()))
                    .statusCode();
              });
      gate.countDown();
      var codes = new ArrayList<>(List.of(fa.get(), fb.get()));
      Collections.sort(codes);
      assertEquals(List.of(200, 409), codes);
    }
  }

  @Test
  @Order(10)
  void holidayAndLeadTimeBlockReservations() throws Exception {
    var b = new Browser();
    b.login("client@example.test");
    assertEquals(
        409,
        b.call(
                "POST",
                "/visits",
                Map.of(
                    "property_id",
                    property,
                    "starts_at",
                    Instant.now().plusSeconds(3600).toString()))
            .statusCode());
    db.update(
        "INSERT INTO holidays(day,name) VALUES (?,?)",
        slot.atZone(VisitService.ZONE).toLocalDate(),
        "Feriado de teste");
    assertEquals(
        409,
        b.call(
                "POST",
                "/visits",
                Map.of("property_id", property, "starts_at", slot.plusSeconds(10800).toString()))
            .statusCode());
    db.update("DELETE FROM holidays WHERE day=?", slot.atZone(VisitService.ZONE).toLocalDate());
  }

  @Test
  @Order(11)
  void contactPersistsDespiteUnavailableSmtp() throws Exception {
    var b = new Browser();
    var res =
        b.call(
            "POST",
            "/public/contacts",
            Map.of(
                "property_id",
                property,
                "name",
                "Interessado fictício",
                "email",
                "lead@example.test",
                "phone",
                "11999999999",
                "message",
                "Gostaria de conhecer este imóvel."));
    assertEquals(200, res.statusCode(), res.body());
    long id = json.readTree(res.body()).get("id").asLong();
    assertEquals(1, db.count("SELECT COUNT(*) FROM contacts WHERE id=?", id));
    var brokerBrowser = new Browser();
    brokerBrowser.login("broker@example.test");
    assertEquals(
        200,
        brokerBrowser
            .call(
                "POST",
                "/contacts/" + id + "/replies",
                Map.of("message", "Vamos organizar sua visita."))
            .statusCode());
    assertEquals(1, db.count("SELECT COUNT(*) FROM messages WHERE contact_id=?", id));
    assertTrue(db.count("SELECT COUNT(*) FROM outbox WHERE recipient='lead@example.test'") > 0);
  }

  @Test
  @Order(12)
  void duplicateEmailAndExpiredTokenRejected() throws Exception {
    var b = new Browser();
    var payload =
        Map.of(
            "name",
            "Duplicado",
            "cpf",
            "52998224725",
            "email",
            "new@example.test",
            "phone",
            "11999999999",
            "address",
            "Endereço fictício",
            "password",
            "PilotSecure25","terms_accepted",true,"terms_version",PrivacyService.VERSION);
    assertEquals(409, b.call("POST", "/auth/register", payload).statusCode());
    db.update(
        "INSERT INTO account_tokens(user_id,token_hash,purpose,expires_at) VALUES (?,?,?,?)",
        client,
        AuthService.hash("expired"),
        "CONFIRM",
        Timestamp.from(Instant.now().minusSeconds(60)));
    assertEquals(400, b.call("POST", "/auth/confirm", Map.of("token", "expired")).statusCode());
  }

  @Test
  @Order(13)
  void cancellationBoundaryAndManualOutcome() throws Exception {
    Instant soon = Instant.now().plusSeconds(11 * 3600);
    long visit =
        db.insert(
            "INSERT INTO visits(property_id,client_id,broker_id,starts_at,ends_at) VALUES"
                + " (?,?,?,?,?)",
            property,
            client,
            broker,
            Timestamp.from(soon),
            Timestamp.from(soon.plusSeconds(3600)));
    var customer = new Browser();
    customer.login("client@example.test");
    assertEquals(
        409,
        customer
            .call("PATCH", "/visits/" + visit + "/status", Map.of("status", "CANCELLED"))
            .statusCode());
    var another = new Browser();
    another.login("other@example.test");
    assertEquals(
        403,
        another
            .call("PATCH", "/visits/" + visit + "/status", Map.of("status", "CANCELLED"))
            .statusCode());
    var staff = new Browser();
    staff.login("broker@example.test");
    assertEquals(
        200,
        staff
            .call("PATCH", "/visits/" + visit + "/status", Map.of("status", "CANCELLED"))
            .statusCode());
    Instant past = Instant.now().minusSeconds(7200);
    long previous =
        db.insert(
            "INSERT INTO visits(property_id,client_id,broker_id,starts_at,ends_at,status) VALUES"
                + " (?,?,?,?,?,'CONFIRMED')",
            property,
            client,
            broker,
            Timestamp.from(past),
            Timestamp.from(past.plusSeconds(3600)));
    assertEquals(
        "CONFIRMED", db.one("SELECT status FROM visits WHERE id=?", previous).get("status"));
    assertEquals(
        200,
        staff
            .call("PATCH", "/visits/" + previous + "/status", Map.of("status", "COMPLETED"))
            .statusCode());
    assertEquals(
        "COMPLETED", db.one("SELECT status FROM visits WHERE id=?", previous).get("status"));
  }

  @Autowired ImageStorage imageStorage;
  @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;

  @Test
  @Order(14)
  void demoExpansionAddsExactlyTenOnceWithImages() throws Exception {
    user("corretor@example.test", "10000000006", "BROKER");
    user("proprietario@example.test", "10000000007", "OWNER");
    long before = db.count("SELECT COUNT(*) FROM properties");
    var seeder = new ExpandedDemoSeeder(db, imageStorage);
    var transaction =
        new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    for (int run = 0; run < 2; run++) {
      transaction.executeWithoutResult(
          status -> {
            try {
              seeder.run(null);
            } catch (Exception e) {
              throw new RuntimeException(e);
            }
          });
    }
    assertEquals(before + 10, db.count("SELECT COUNT(*) FROM properties"));
    assertEquals(1, db.count("SELECT COUNT(*) FROM audit WHERE action='DEMO_CATALOG_10'"));
    assertEquals(2, db.count("SELECT COUNT(*) FROM properties WHERE type='PENTHOUSE'"));
    assertEquals(
        10,
        db.count(
            "SELECT COUNT(*) FROM properties p JOIN users u ON u.id=p.broker_id WHERE"
                + " u.email='corretor@example.test' AND (SELECT COUNT(*) FROM property_images WHERE"
                + " property_id=p.id)=3"));
    var response = new Browser().call("GET", "/public/properties?type=PENTHOUSE", null);
    assertEquals(200, response.statusCode());
    assertEquals(2, json.readTree(response.body()).get("total").asInt());
  }

  @Autowired PrivacyService privacy;
  @Autowired PrivacyRetention retention;
  @Autowired VisitIdentity identity;
  @Test @Order(15)
  void privacyChoicesExportErasureAndRetention() throws Exception {
    var b=new Browser();
    var payload=new java.util.HashMap<String,Object>(Map.of("name","Privacidade teste","email","privacy@example.test","password","PilotSecure25"));
    assertEquals(400,b.call("POST","/auth/register",payload).statusCode());
    payload.put("terms_accepted",true);payload.put("terms_version",PrivacyService.VERSION);payload.put("marketing",false);
    assertEquals(200,b.call("POST","/auth/register",payload).statusCode());
    var u=db.one("SELECT * FROM users WHERE email='privacy@example.test'");long id=Db.id(u,"id");
    assertNull(u.get("cpf"));assertNull(u.get("address"));assertNull(u.get("phone"));
    assertEquals(1,db.count("SELECT COUNT(*) FROM legal_acceptances WHERE user_id=?",id));
    db.update("UPDATE users SET confirmed=TRUE WHERE id=?",id);b.login("privacy@example.test");
    assertEquals(200,b.call("PUT","/privacy/marketing",Map.of("allowed",true)).statusCode());
    var msg=db.one("SELECT body FROM outbox WHERE recipient='privacy@example.test' ORDER BY id DESC LIMIT 1");
    String raw=((String)msg.get("body")).split("token=")[1];
    db.update("INSERT INTO outbox(recipient,subject,body,category) VALUES ('privacy@example.test','Oferta',?,'MARKETING')","Oferta "+"http://localhost:3000"+"/descadastro?token="+raw);
    var anonymous=new Browser();
    assertEquals(200,anonymous.call("POST","/public/privacy/unsubscribe",Map.of("token",raw)).statusCode());
    assertEquals(200,anonymous.call("POST","/public/privacy/unsubscribe",Map.of("token",raw)).statusCode());
    assertEquals(0,db.count("SELECT COUNT(*) FROM outbox WHERE recipient='privacy@example.test' AND category='MARKETING' AND status='PENDING'"));
    var data=b.call("GET","/privacy/data",null);assertEquals(200,data.statusCode());assertFalse(data.body().contains("password_hash"));assertFalse(data.body().contains("unsubscribe_hash"));
    assertEquals(200,b.call("POST","/privacy/requests",Map.of("kind","DELETE")).statusCode());
    assertEquals(401,b.call("GET","/me",null).statusCode());
    assertEquals("Conta removida",db.one("SELECT name FROM users WHERE id=?",id).get("name"));
    assertEquals(LocalDate.of(2026,11,19),PrivacyService.deadline(LocalDate.of(2026,11,13),Set.of(LocalDate.of(2026,11,17))));
    var restricted=new HashMap<String,Object>(Map.of("entry_reason","Portaria documentada","entry_recipient","Recepção","entry_until",LocalDate.now().plusDays(10).toString()));
    assertThrows(Fault.class,()->identity.save(1,restricted,"123",Instant.now()));
    String cipher=identity.crypt("52998224725",false);assertFalse(cipher.contains("52998224725"));assertEquals("52998224725",identity.crypt(cipher,true));
    long v=db.insert("INSERT INTO visits(property_id,client_id,broker_id,starts_at,ends_at,status) VALUES (?,?,?,?,?,'COMPLETED')",property,client,broker,Timestamp.from(Instant.now().minusSeconds(10000)),Timestamp.from(Instant.now().minusSeconds(6400)));
    identity.save(v,restricted,"52998224725",Instant.now().minusSeconds(6400));
    assertEquals(1,db.count("SELECT COUNT(*) FROM visit_identity WHERE visit_id=?",v));
    new org.springframework.transaction.support.TransactionTemplate(transactionManager).executeWithoutResult(status->retention.cleanAt(Instant.now().plusSeconds(2*86400)));
    assertEquals(0,db.count("SELECT COUNT(*) FROM visit_identity WHERE visit_id=?",v));
  }

 @Autowired MailQueue mailQueue;
 @Test @Order(16)
 void publicRightsAreScopedAndQueuedPromotionIsRechecked() throws Exception {
  String raw="test-only-privacy-link";
  db.update("INSERT INTO privacy_tokens(token_hash,email,expires_at) VALUES (?,?,TIMESTAMPADD(HOUR,1,CURRENT_TIMESTAMP(6)))",AuthService.hash(raw),"guest@example.test");
  db.update("INSERT INTO contacts(property_id,broker_id,name,email,message) VALUES (?,?,'Pessoa fictícia','guest@example.test','Contato de teste para privacidade')",property,broker);
  var guest=new Browser();
  var result=guest.call("POST","/public/privacy/data",Map.of("token",raw));assertEquals(200,result.statusCode());assertTrue(result.body().contains("guest@example.test"));assertFalse(result.body().contains("client@example.test"));
  assertEquals(400,guest.call("POST","/public/privacy/data",Map.of("token","invalid")).statusCode());
  assertEquals(200,guest.call("POST","/public/privacy/requests",Map.of("token",raw,"kind","DELETE")).statusCode());
  assertEquals(0,db.count("SELECT COUNT(*) FROM contacts WHERE email='guest@example.test'"));
  long mail=db.insert("INSERT INTO outbox(recipient,subject,body,category) VALUES ('privacy@example.test','Oferta indevida','Sem autorização','MARKETING')");
  mailQueue.deliver();assertEquals("CANCELLED",db.one("SELECT status FROM outbox WHERE id=?",mail).get("status"));
  assertEquals(200,guest.call("GET","/public/legal/terms/"+PrivacyService.VERSION,null).statusCode());
 }

 @Test @Order(17)
 void cpfRuleIsEnforcedPerVisitAndCancellationPurges() throws Exception {
  var staff=new Browser();staff.login((String)db.one("SELECT email FROM users WHERE id=?",admin).get("email"));
  var day=slot.atZone(VisitService.ZONE).toLocalDate().plusDays(14);
  while(day.getDayOfWeek()==DayOfWeek.SUNDAY || db.count("SELECT COUNT(*) FROM holidays WHERE day=?",day)>0)day=day.plusDays(1);
  db.update("UPDATE properties SET status='AVAILABLE' WHERE id=?",property);
  db.update("INSERT INTO availability(broker_id,weekday,start_hour,end_hour) VALUES (?,?,9,18)",broker,day.getDayOfWeek().getValue());
  assertEquals(200,staff.call("PUT","/admin/properties/"+property+"/entry",Map.of("reason","Portaria exige identificação documentada","recipient","Recepção do local","until",day.plusDays(1).toString())).statusCode());
  var clientBrowser=new Browser();clientBrowser.login("client@example.test");
  var body=new HashMap<String,Object>(Map.of("property_id",property,"starts_at",day.atTime(14,0).atZone(VisitService.ZONE).toInstant().toString()));
  assertEquals(400,clientBrowser.call("POST","/visits",body).statusCode());body.put("cpf","52998224725");
  var booked=clientBrowser.call("POST","/visits",body);assertEquals(200,booked.statusCode(),booked.body());long visit=json.readTree(booked.body()).get("id").asLong();
  assertEquals(403,clientBrowser.call("GET","/visits/"+visit+"/identity",null).statusCode());
  assertTrue(clientBrowser.call("GET","/privacy/data",null).body().contains("52998224725"));
  assertEquals(200,staff.call("GET","/visits/"+visit+"/identity",null).statusCode());
  assertEquals(200,clientBrowser.call("PATCH","/visits/"+visit+"/status",Map.of("status","CANCELLED")).statusCode());
  assertEquals(0,db.count("SELECT COUNT(*) FROM visit_identity WHERE visit_id=?",visit));
 }

 @Test @Order(18)
 void deactivationRevokesMarketingAndHasRetentionEnd() throws Exception {
  long id=user("deactivation@example.test","10000000008","CLIENT");var b=new Browser();b.login("deactivation@example.test");
  privacy.marketing(id,true);
  assertEquals(200,b.call("DELETE","/me",null).statusCode());
  assertEquals(0,db.count("SELECT COUNT(*) FROM marketing_preferences WHERE user_id=? AND allowed=TRUE",id));
  assertEquals(1,db.count("SELECT COUNT(*) FROM legal_acceptances WHERE user_id=? AND expires_at IS NOT NULL",id));
  var tx=new org.springframework.transaction.support.TransactionTemplate(transactionManager);
  tx.executeWithoutResult(status->retention.cleanAt(Instant.now().plusSeconds(400L*86400)));
  tx.executeWithoutResult(status->retention.cleanAt(Instant.now().plusSeconds(435L*86400)));
  assertEquals("Conta removida",db.one("SELECT name FROM users WHERE id=?",id).get("name"));
 }
}
