package com.journal.journal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "encounters")
public class Encounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private String description;

    @ManyToOne
    private Patient patient;

    @ManyToOne
    private Practitioner practitioner;

    @ManyToOne
    private Location location;

    public Encounter() {}

    public Encounter(LocalDate date, String description, Patient patient, Practitioner practitioner, Location location) {
        this.date = date;
        this.description = description;
        this.patient = patient;
        this.practitioner = practitioner;
        this.location = location;
    }

    public Long getId() { return id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Practitioner getPractitioner() { return practitioner; }
    public void setPractitioner(Practitioner practitioner) { this.practitioner = practitioner; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
}