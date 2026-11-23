package com.journal.journal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String ssNumber;

    private Long userId;

    public Patient() {}

    public Patient(String name, String ssNumber, Long userId) {
        this.name = name;
        this.ssNumber = ssNumber;
        this.userId = userId;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSsNumber() { return ssNumber; }
    public void setSsNumber(String ssNumber) { this.ssNumber = ssNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}