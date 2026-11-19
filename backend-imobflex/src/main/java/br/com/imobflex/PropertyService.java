package br.com.imobflex;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PropertyService {
  record Input(
      @NotBlank @Size(max = 160) String title,
      @NotBlank String type,
      @NotBlank String purpose,
      @NotBlank @Size(min = 50, max = 10000) String description,
      @Pattern(regexp = "[0-9]{8}") @NotNull String cep,
      @NotBlank @Size(max = 200) String street,
      @NotBlank @Size(max = 20) String number,
      @NotBlank @Size(max = 100) String neighborhood,
      @NotBlank @Size(max = 100) String city,
      @Pattern(regexp = "[A-Z]{2}") @NotNull String state,
      BigDecimal sale_price,
      BigDecimal rent_price,
      @NotNull @DecimalMin("0.01") BigDecimal area,
      @Min(0) int bedrooms,
      @Min(0) int bathrooms,
      @Min(0) int parking,
      @Min(1) long owner_id,
      @Min(1) long broker_id) {}

  static final String PUBLIC =
      "p.id,p.title,p.type,p.purpose,p.description,p.neighborhood,p.city,p.state,p.sale_price,p.rent_price,p.area,p.bedrooms,p.bathrooms,p.parking,p.status,p.created_at,p.entry_reason,p.entry_recipient,p.entry_until,(SELECT"
          + " thumbnail FROM property_images WHERE property_id=p.id ORDER BY position LIMIT 1) AS"
          + " cover";
  final Db db;
  final Access access;
  final MailQueue mail;

  PropertyService(Db db, Access access, MailQueue mail) {
    this.db = db;
    this.access = access;
    this.mail = mail;
  }

  Map<String, Object> raw(long id) {
    return db.one("SELECT * FROM properties WHERE id=?", id);
  }

  void lock(long id) {
    db.one("SELECT id FROM properties WHERE id=? FOR UPDATE", id);
  }

  void validate(Input i) {
    if (!Set.of("HOUSE", "APARTMENT", "PENTHOUSE", "LAND", "COMMERCIAL", "WAREHOUSE")
            .contains(i.type())
        || !Set.of("SALE", "RENT", "BOTH").contains(i.purpose()))
      throw new Fault(400, "Tipo ou finalidade inválidos.");
    if ((!i.purpose().equals("RENT") && (i.sale_price() == null || i.sale_price().signum() <= 0))
        || (!i.purpose().equals("SALE")
            && (i.rent_price() == null || i.rent_price().signum() <= 0)))
      throw new Fault(400, "Informe os valores da finalidade selecionada.");
    for (var price : new BigDecimal[] {i.sale_price(), i.rent_price()})
      if (price != null
          && (price.scale() > 2 || price.precision() - price.scale() > 13 || price.signum() < 0))
        throw new Fault(400, "Preço inválido.");
    if (db.count(
                "SELECT COUNT(*) FROM users WHERE id=? AND role='OWNER' AND active=TRUE",
                i.owner_id())
            == 0
        || db.count(
                "SELECT COUNT(*) FROM users WHERE id=? AND role IN ('BROKER','ADMIN') AND"
                    + " active=TRUE",
                i.broker_id())
            == 0) throw new Fault(400, "Selecione proprietário e corretor ativos.");
    if (!access.admin() && i.broker_id() != access.id())
      throw new Fault(403, "Selecione seu próprio usuário como corretor.");
  }

  Object[] values(Input i) {
    return new Object[] {
      i.title(),
      i.type(),
      i.purpose(),
      i.description(),
      i.cep(),
      i.street(),
      i.number(),
      i.neighborhood(),
      i.city(),
      i.state(),
      i.sale_price(),
      i.rent_price(),
      i.area(),
      i.bedrooms(),
      i.bathrooms(),
      i.parking(),
      i.owner_id(),
      i.broker_id()
    };
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public long create(Input i) {
    access.staff();
    validate(i);
    long id =
        db.insert(
            "INSERT INTO"
                + " properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,rent_price,area,bedrooms,bathrooms,parking,owner_id,broker_id)"
                + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            values(i));
    db.audit(access.id(), "CREATE", "property", id, "PENDING");
    return id;
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void edit(long id, Input i) {
    lock(id);
    var old = raw(id);
    access.property(old);
    validate(i);
    if (Db.id(old, "broker_id") != i.broker_id()
        && db.count(
                "SELECT COUNT(*) FROM visits WHERE property_id=? AND status IN"
                    + " ('SCHEDULED','CONFIRMED')",
                id)
            > 0) throw new Fault(409, "Resolva as visitas pendentes antes de trocar o corretor.");
    var args = new ArrayList<>(Arrays.asList(values(i)));
    args.add(id);
    db.update(
        "UPDATE properties SET"
            + " title=?,type=?,purpose=?,description=?,cep=?,street=?,number=?,neighborhood=?,city=?,state=?,sale_price=?,rent_price=?,area=?,bedrooms=?,bathrooms=?,parking=?,owner_id=?,broker_id=?"
            + " WHERE id=?",
        args.toArray());
    db.audit(access.id(), "EDIT", "property", id, "Campos do anúncio atualizados");
    if (old.get("status").equals("NEGOTIATING")) alertAdmins(id);
  }

  void alertAdmins(long id) {
    for (var a : db.list("SELECT id FROM users WHERE role='ADMIN' AND active=TRUE"))
      mail.notify(Db.id(a, "id"), "Revise as alterações no imóvel #" + id + ", em negociação.");
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void status(long id, String status) {
    lock(id);
    var p = raw(id);
    access.property(p);
    if (!Set.of("AVAILABLE", "NEGOTIATING", "SOLD", "RENTED", "INACTIVE").contains(status))
      throw new Fault(400, "Status inválido.");
    String old = (String) p.get("status");
    if (old.equals(status)) return;
    if (old.equals("PENDING") && !access.admin())
      throw new Fault(403, "A primeira publicação precisa de aprovação do administrador.");
    if ((status.equals("AVAILABLE") || status.equals("NEGOTIATING"))
        && db.count("SELECT COUNT(*) FROM property_images WHERE property_id=?", id) < 3)
      throw new Fault(409, "Inclua pelo menos três imagens antes de publicar.");
    if (status.equals("SOLD") && p.get("purpose").equals("RENT")
        || status.equals("RENTED") && p.get("purpose").equals("SALE"))
      throw new Fault(409, "Status incompatível com a finalidade.");
    db.update("UPDATE properties SET status=? WHERE id=?", status, id);
    if (Set.of("SOLD", "RENTED", "INACTIVE").contains(status)) {
      for (var v :
          db.list(
              "SELECT id,client_id FROM visits WHERE property_id=? AND"
                  + " starts_at>CURRENT_TIMESTAMP(6) AND status IN ('SCHEDULED','CONFIRMED')",
              id)) {
        db.update("UPDATE visits SET status='CANCELLED' WHERE id=?", v.get("id"));
        db.update("DELETE FROM visit_identity WHERE visit_id=?", v.get("id"));
        mail.notify(
            Db.id(v, "client_id"), "Visita #" + v.get("id") + " cancelada: imóvel indisponível.");
      }
    } else if (status.equals("NEGOTIATING")) {
      mail.notify(
          Db.id(p, "broker_id"),
          "Imóvel #" + id + " em negociação. Revise as visitas já reservadas.");
    }
    for (var c :
        db.list(
            "SELECT email FROM contacts WHERE property_id=? UNION SELECT u.email FROM visits v JOIN"
                + " users u ON u.id=v.client_id WHERE v.property_id=?",
            id,
            id))
      mail.enqueue(
          (String) c.get("email"),
          "Atualização do imóvel de interesse",
          "O imóvel #"
              + id
              + " teve seu status atualizado. Consulte a imobiliária para mais informações.");
    db.audit(access.id(), "STATUS", "property", id, old + " -> " + status);
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void delete(long id) {
    lock(id);
    var p = raw(id);
    access.property(p);
    if (!p.get("status").equals("PENDING")
        || db.count("SELECT COUNT(*) FROM visits WHERE property_id=?", id) > 0
        || db.count("SELECT COUNT(*) FROM contacts WHERE property_id=?", id) > 0)
      throw new Fault(409, "Este imóvel possui histórico. Utilize inativar.");
    db.update("DELETE FROM properties WHERE id=?", id);
    db.audit(access.id(), "DELETE", "property", id, "Exclusão de pendente sem interações");
  }

  Map<String, Object> detail(long id, boolean internal) {
    if (internal) {
      var p = raw(id);
      access.property(p);
      p.put(
          "images",
          db.list(
              "SELECT id,path,thumbnail,position FROM property_images WHERE property_id=? ORDER BY"
                  + " position",
              id));
      return p;
    }
    var p =
        db.one(
            "SELECT "
                + PUBLIC
                + " FROM properties p WHERE p.id=? AND p.status IN ('AVAILABLE','NEGOTIATING')",
            id);
    p.put(
        "images",
        db.list(
            "SELECT id,path,thumbnail,position FROM property_images WHERE property_id=? ORDER BY"
                + " position",
            id));
    return p;
  }

  Map<String, Object> search(Map<String, String> filters) {
    var args = new ArrayList<Object>();
    var where = new StringBuilder(" WHERE p.status IN ('AVAILABLE','NEGOTIATING')");
    String purpose = filters.getOrDefault("purpose", "");
    if (!purpose.isBlank()) {
      if (!Set.of("SALE", "RENT").contains(purpose)) throw new Fault(400, "Finalidade inválida.");
      where.append(" AND p.purpose IN (?, 'BOTH')");
      args.add(purpose);
    }
    String type = filters.getOrDefault("type", "");
    if (!type.isBlank()) {
      where.append(" AND p.type=?");
      args.add(type);
    }
    String q = filters.getOrDefault("q", "").strip();
    if (q.length() > 100) throw new Fault(400, "Busca muito longa.");
    if (!q.isBlank()) {
      where.append(" AND (p.city LIKE ? OR p.neighborhood LIKE ? OR p.cep LIKE ?)");
      String term =
          "%"
              + q.replace("!", "!!").replace("%", "!%").replace("_", "!_")
              + "%"; // prepared values; wildcard escaping is applied below
      where = new StringBuilder(where.toString().replace("LIKE ?", "LIKE ? ESCAPE '!'"));
      args.addAll(List.of(term, term, term));
    }
    String price = purpose.equals("RENT") ? "p.rent_price" : "COALESCE(p.sale_price,p.rent_price)";
    Map<String, String> fields =
        Map.of(
            "minPrice",
            price + ">=",
            "maxPrice",
            price + "<=",
            "minArea",
            "p.area>=",
            "maxArea",
            "p.area<=",
            "bedrooms",
            "p.bedrooms>=",
            "bathrooms",
            "p.bathrooms>=",
            "parking",
            "p.parking>=");
    for (var f : fields.entrySet()) {
      String v = filters.get(f.getKey());
      if (v != null && !v.isBlank()) {
        BigDecimal n = new BigDecimal(v);
        if (n.signum() < 0) throw new Fault(400, "Filtros não podem ser negativos.");
        where.append(" AND ").append(f.getValue()).append("?");
        args.add(n);
      }
    }
    int page = Math.max(0, Integer.parseInt(filters.getOrDefault("page", "0")));
    if (page > 100000) throw new Fault(400, "Página inválida.");
    long total = db.count("SELECT COUNT(*) FROM properties p" + where, args.toArray());
    String sort = filters.getOrDefault("sort", "newest");
    String order =
        switch (sort) {
          case "priceAsc" -> price + " ASC,p.id DESC";
          case "priceDesc" -> price + " DESC,p.id DESC";
          default -> "p.created_at DESC,p.id DESC";
        };
    if (sort.equals("relevance") && !q.isBlank()) {
      order =
          "CASE WHEN p.neighborhood=? THEN 0 WHEN p.city=? THEN 1 ELSE 2 END,p.created_at DESC,p.id"
              + " DESC";
      args.add(q);
      args.add(q);
    }
    args.add(page * 12);
    return Map.of(
        "items",
        db.list(
            "SELECT "
                + PUBLIC
                + " FROM properties p"
                + where
                + " ORDER BY "
                + order
                + " LIMIT 12 OFFSET ?",
            args.toArray()),
        "total",
        total,
        "page",
        page,
        "size",
        12);
  }
}
