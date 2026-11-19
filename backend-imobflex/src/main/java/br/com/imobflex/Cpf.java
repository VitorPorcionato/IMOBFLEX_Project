package br.com.imobflex;

public final class Cpf {
  private Cpf() {}

  public static String normalize(String raw) {
    return raw == null ? "" : raw.replaceAll("[.\\-\\s]", "");
  }

  public static boolean valid(String raw) {
    String s = normalize(raw);
    if (!s.matches("[0-9]{11}") || s.chars().distinct().count() == 1) return false;
    for (int n = 9; n <= 10; n++) {
      int sum = 0;
      for (int i = 0; i < n; i++) sum += (s.charAt(i) - 48) * (n + 1 - i);
      int digit = (sum * 10) % 11;
      if (digit == 10) digit = 0;
      if (digit != s.charAt(n) - 48) return false;
    }
    return true;
  }
}
