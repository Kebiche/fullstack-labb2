package com.journal.journal.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "conditions")
public class Condition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    @ManyToOne
    private Patient patient;

    @ManyToOne
    private Practitioner practitioner;

    public Condition() {}

    public Condition(String description, Patient patient, Practitioner practitioner) {
        this.description = description;
        this.patient = patient;
        this.practitioner = practitioner;
    }

    public Long getId() { return id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Practitioner getPractitioner() { return practitioner; }
    public void setPractitioner(Practitioner practitioner) { this.practitioner = practitioner; }
}