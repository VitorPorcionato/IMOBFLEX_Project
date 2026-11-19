package br.com.imobflex;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
class UserAccount {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  Long id;

  @Column(nullable = false, length = 120)
  String name;

  @Column(nullable = false, length = 254, unique = true)
  String email;

  @Column(name = "password_hash", nullable = false, length = 100)
  String passwordHash;

  @Column(nullable = false, length = 20)
  String role;

  boolean active;
  boolean confirmed;

  protected UserAccount() {}
}
