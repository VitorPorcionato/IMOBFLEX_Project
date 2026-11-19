package br.com.imobflex;

public class Fault extends RuntimeException {
  final int status;

  public Fault(int status, String message) {
    super(message);
    this.status = status;
  }
}
