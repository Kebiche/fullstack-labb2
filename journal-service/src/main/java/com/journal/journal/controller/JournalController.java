package com.journal.journal.controller;

import com.journal.journal.entity.*;
import com.journal.journal.service.JournalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    // Patienter
    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return journalService.getAllPatients();
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<Patient> getPatient(@PathVariable Long id) {
        return journalService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/patients")
    public Patient createPatient(@RequestBody Patient patient) {
        return journalService.savePatient(patient);
    }

    // Practitioners
    @GetMapping("/practitioners")
    public List<Practitioner> getAllPractitioners() {
        return journalService.getAllPractitioners();
    }

    @GetMapping("/practitioners/{id}")
    public ResponseEntity<Practitioner> getPractitioner(@PathVariable Long id) {
        return journalService.getPractitionerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/practitioners")
    public Practitioner createPractitioner(@RequestBody Practitioner practitioner) {
        return journalService.savePractitioner(practitioner);
    }

    // Organisationer
    @GetMapping("/organizations")
    public List<Organization> getAllOrganizations() {
        return journalService.getAllOrganizations();
    }

    @PostMapping("/organizations")
    public Organization createOrganization(@RequestBody Organization organization) {
        return journalService.saveOrganization(organization);
    }

    // Platser
    @GetMapping("/locations")
    public List<Location> getAllLocations() {
        return journalService.getAllLocations();
    }

    @PostMapping("/locations")
    public Location createLocation(@RequestBody Location location) {
        return journalService.saveLocation(location);
    }
}