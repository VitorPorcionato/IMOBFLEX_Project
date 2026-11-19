package br.com.imobflex;

import java.math.BigDecimal;
import java.sql.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;

@Component
public class Db {
  final JdbcTemplate jdbc;

  public Db(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public List<Map<String, Object>> list(String sql, Object... args) {
    return jdbc.query(
        sql,
        (rs, n) -> {
          Map<String, Object> m = new LinkedHashMap<>();
          var md = rs.getMetaData();
          for (int i = 1; i <= md.getColumnCount(); i++) {
            Object v = rs.getObject(i);
            if (v instanceof Timestamp t) v = t.toInstant().toString();
            if (v instanceof BigDecimal b) v = b.toPlainString();
            if (v instanceof java.sql.Date d) v = d.toLocalDate().toString();
            m.put(md.getColumnLabel(i), v);
          }
          return m;
        },
        args);
  }

  public Map<String, Object> one(String sql, Object... args) {
    var rows = list(sql, args);
    if (rows.isEmpty()) throw new Fault(404, "Registro não encontrado.");
    return rows.getFirst();
  }

  public long insert(String sql, Object... args) {
    var key = new GeneratedKeyHolder();
    jdbc.update(
        c -> {
          var p = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
          for (int i = 0; i < args.length; i++) p.setObject(i + 1, args[i]);
          return p;
        },
        key);
    return Objects.requireNonNull(key.getKey()).longValue();
  }

  public int update(String sql, Object... args) {
    return jdbc.update(sql, args);
  }

  public long count(String sql, Object... args) {
    return Objects.requireNonNull(jdbc.queryForObject(sql, Long.class, args));
  }

  public void audit(Long actor, String action, String type, long id, String details) {
    update(
        "INSERT INTO audit(actor_id,action,resource_type,resource_id,details) VALUES (?,?,?,?,?)",
        actor,
        action,
        type,
        id,
        details);
  }

  static long id(Map<String, Object> row, String key) {
    return ((Number) row.get(key)).longValue();
  }

  static boolean yes(Object v) {
    return Boolean.TRUE.equals(v) || (v instanceof Number n && n.intValue() != 0);
  }
}
