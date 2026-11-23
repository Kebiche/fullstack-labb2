package com.journal.journal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "locations")
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String locationName;

    private String address;

    @ManyToOne
    private Organization organization;

    public Location() {}

    public Location(String locationName, String address, Organization organization) {
        this.locationName = locationName;
        this.address = address;
        this.organization = organization;
    }

    public Long getId() { return id; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Organization getOrganization() { return organization; }
    public void setOrganization(Organization organization) { this.organization = organization; }
}