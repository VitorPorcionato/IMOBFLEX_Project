package br.com.imobflex;

import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
class VisitIdentity {
  final Db db;
  final String key;

  VisitIdentity(Db db, @Value("${PRIVACY_ENCRYPTION_KEY:}") String key) {
    this.db = db;
    this.key = key;
  }

  boolean required(Map<String, Object> p) {
    return p.get("entry_until") != null
        && !LocalDate.parse(p.get("entry_until").toString())
            .isBefore(LocalDate.now(VisitService.ZONE))
        && p.get("entry_reason") != null
        && p.get("entry_recipient") != null;
  }

  void save(long visit, Map<String, Object> property, String cpf, Instant end) {
    if (!required(property)) return;
    if (!Cpf.valid(cpf))
      throw new Fault(400, "Informe um CPF válido para a regra de entrada deste imóvel.");
    db.update(
        "INSERT INTO visit_identity(visit_id,ciphertext,expires_at) VALUES (?,?,?)",
        visit,
        crypt(Cpf.normalize(cpf), false),
        java.sql.Timestamp.from(end.plusSeconds(86400)));
  }

  String crypt(String value, boolean decrypt) {
    try {
      byte[] secret = Base64.getDecoder().decode(key);
      if (secret.length != 32) throw new IllegalArgumentException();
      Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
      byte[] nonce = new byte[12];
      if (decrypt) {
        byte[] all = Base64.getDecoder().decode(value);
        System.arraycopy(all, 0, nonce, 0, 12);
        c.init(
            Cipher.DECRYPT_MODE,
            new SecretKeySpec(secret, "AES"),
            new GCMParameterSpec(128, nonce));
        return new String(
            c.doFinal(Arrays.copyOfRange(all, 12, all.length)),
            java.nio.charset.StandardCharsets.UTF_8);
      }
      new SecureRandom().nextBytes(nonce);
      c.init(
          Cipher.ENCRYPT_MODE, new SecretKeySpec(secret, "AES"), new GCMParameterSpec(128, nonce));
      byte[] encrypted = c.doFinal(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      byte[] all = new byte[12 + encrypted.length];
      System.arraycopy(nonce, 0, all, 0, 12);
      System.arraycopy(encrypted, 0, all, 12, encrypted.length);
      return Base64.getEncoder().encodeToString(all);
    } catch (Exception e) {
      throw new Fault(503, "Controle de entrada temporariamente indisponível. Procure a equipe.");
    }
  }
}
