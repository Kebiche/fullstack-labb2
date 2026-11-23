package com.journal.journal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "observations")
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private String note;

    @ManyToOne
    private Practitioner practitioner;

    @ManyToOne
    private Patient patient;

    @ManyToOne
    private Encounter encounter;

    public Observation() {}

    public Observation(LocalDate date, String note, Practitioner practitioner, Patient patient, Encounter encounter) {
        this.date = date;
        this.note = note;
        this.practitioner = practitioner;
        this.patient = patient;
        this.encounter = encounter;
    }

    public Long getId() { return id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Practitioner getPractitioner() { return practitioner; }
    public void setPractitioner(Practitioner practitioner) { this.practitioner = practitioner; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Encounter getEncounter() { return encounter; }
    public void setEncounter(Encounter encounter) { this.encounter = encounter; }
}