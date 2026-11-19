package br.com.imobflex;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
class Images {
  final Db db;
  final Access access;
  final PropertyService properties;
  final ImageStorage storage;

  Images(Db db, Access access, PropertyService properties, ImageStorage storage) {
    this.db = db;
    this.access = access;
    this.properties = properties;
    this.storage = storage;
  }

  @Transactional(
      isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED,
      rollbackFor = Exception.class)
  public void upload(long id, MultipartFile[] files) throws IOException {
    properties.lock(id);
    var p = properties.raw(id);
    access.property(p);
    int count = (int) db.count("SELECT COUNT(*) FROM property_images WHERE property_id=?", id);
    if (files.length == 0 || count + files.length > 20)
      throw new Fault(400, "Limite de 20 imagens por imóvel.");
    var decoded = new java.util.ArrayList<BufferedImage>();
    for (var file : files) {
      if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024)
        throw new Fault(400, "Cada imagem deve ter até 5 MB.");
      try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
        var readers = ImageIO.getImageReaders(input);
        if (!readers.hasNext()) throw new Fault(400, "Envie uma imagem JPG ou PNG válida.");
        var reader = readers.next();
        try {
          reader.setInput(input);
          if (!java.util.Set.of("JPEG", "PNG").contains(reader.getFormatName().toUpperCase())
              || (long) reader.getWidth(0) * reader.getHeight(0) > 40000000)
            throw new Fault(400, "Imagem inválida ou maior que 40 megapixels.");
          decoded.add(reader.read(0));
        } finally {
          reader.dispose();
        }
      }
    }
    for (var img : decoded) {
      String path = storage.save(resize(img, 1800));
      String thumb = storage.save(resize(img, 640));
      db.update(
          "INSERT INTO property_images(property_id,path,thumbnail,position) VALUES (?,?,?,?)",
          id,
          path,
          thumb,
          count++);
    }
    db.audit(access.id(), "IMAGES", "property", id, "Imagens adicionadas: " + files.length);
    if (p.get("status").equals("NEGOTIATING")) properties.alertAdmins(id);
  }

  static byte[] resize(BufferedImage source, int max) throws IOException {
    double ratio = Math.min(1, (double) max / Math.max(source.getWidth(), source.getHeight()));
    var img =
        new BufferedImage(
            Math.max(1, (int) (source.getWidth() * ratio)),
            Math.max(1, (int) (source.getHeight() * ratio)),
            BufferedImage.TYPE_INT_RGB);
    var g = img.createGraphics();
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, img.getWidth(), img.getHeight());
    g.setRenderingHint(
        RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    g.drawImage(source, 0, 0, img.getWidth(), img.getHeight(), null);
    g.dispose();
    var out = new ByteArrayOutputStream();
    ImageIO.write(img, "jpg", out);
    return out.toByteArray();
  }

  @Transactional(
      isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED,
      rollbackFor = Exception.class)
  public void cover(long id, long image) {
    properties.lock(id);
    var p = properties.raw(id);
    access.property(p);
    var chosen =
        db.one("SELECT position FROM property_images WHERE id=? AND property_id=?", image, id);
    int pos = ((Number) chosen.get("position")).intValue();
    db.update("UPDATE property_images SET position=-1 WHERE property_id=? AND position=0", id);
    db.update("UPDATE property_images SET position=0 WHERE id=? AND property_id=?", image, id);
    db.update("UPDATE property_images SET position=? WHERE property_id=? AND position=-1", pos, id);
    db.audit(access.id(), "COVER", "property", id, "Capa: " + image);
    if (p.get("status").equals("NEGOTIATING")) properties.alertAdmins(id);
  }

  @Transactional(
      isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED,
      rollbackFor = Exception.class)
  public void remove(long id, long image) {
    properties.lock(id);
    var p = properties.raw(id);
    access.property(p);
    if (!p.get("status").equals("PENDING")
        && db.count("SELECT COUNT(*) FROM property_images WHERE property_id=?", id) <= 3)
      throw new Fault(409, "Mantenha pelo menos três imagens.");
    db.one("SELECT id FROM property_images WHERE id=? AND property_id=?", image, id);
    db.update("DELETE FROM property_images WHERE id=? AND property_id=?", image, id);
    var remaining =
        db.list("SELECT id FROM property_images WHERE property_id=? ORDER BY position", id);
    db.update("UPDATE property_images SET position=-position-100 WHERE property_id=?", id);
    int i = 0;
    for (var row : remaining)
      db.update("UPDATE property_images SET position=? WHERE id=?", i++, row.get("id"));
    db.audit(access.id(), "REMOVE_IMAGE", "property", id, "Imagem: " + image);
    if (p.get("status").equals("NEGOTIATING")) properties.alertAdmins(id);
  }
}
