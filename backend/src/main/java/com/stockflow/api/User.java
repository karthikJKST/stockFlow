package com.stockflow.api;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name = "users")
class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id;
    @Column(nullable = false, unique = true) String username;
    @Column(nullable = false) String password;
    String displayName;
    @Column(precision = 16, scale = 2) BigDecimal cashBalance = new BigDecimal("100000.00");
    @Column(nullable = false) String theme = "dark";

    User() {}
    User(String username, String password, String displayName) {
        this.username = username;
        this.password = password;
        this.displayName = displayName;
    }
}
