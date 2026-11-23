package com.journal.journal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "practitioners")
public class Practitioner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String title;

    private Long userId;

    @ManyToOne
    private Organization organization;

    public Practitioner() {}

    public Practitioner(String name, String title, Long userId, Organization organization) {
        this.name = name;
        this.title = title;
        this.userId = userId;
        this.organization = organization;
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
}