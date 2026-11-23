package com.journal.journal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String organizationName;

    public Organization() {}

    public Organization(String organizationName) {
        this.organizationName = organizationName;
    }

    public Long getId() { return id; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
}