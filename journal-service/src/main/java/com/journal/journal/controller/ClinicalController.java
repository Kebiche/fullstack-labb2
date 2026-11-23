package com.journal.journal.controller;

import com.journal.journal.entity.*;
import com.journal.journal.service.ClinicalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.journal.journal.dto.*;

@RestController
@RequestMapping("/api")
public class ClinicalController {

    private final ClinicalService clinicalService;

    public ClinicalController(ClinicalService clinicalService) {
        this.clinicalService = clinicalService;
    }

    // Encounters
    @PostMapping("/patients/{patientId}/encounters")
    public ResponseEntity<Encounter> createEncounter(
            @PathVariable Long patientId,
            @RequestBody EncounterRequest request) {
        Encounter encounter = clinicalService.createEncounter(
                patientId, request.practitionerId, request.locationId, request.description);
        return ResponseEntity.ok(encounter);
    }

    @GetMapping("/patients/{patientId}/encounters")
    public List<Encounter> getEncounters(@PathVariable Long patientId) {
        return clinicalService.getEncountersByPatient(patientId);
    }

    // Observations
    @PostMapping("/patients/{patientId}/observations")
    public ResponseEntity<Observation> createObservation(
            @PathVariable Long patientId,
            @RequestBody ObservationRequest request) {
        Observation observation = clinicalService.createObservation(
                patientId, request.practitionerId, request.encounterId, request.note);
        return ResponseEntity.ok(observation);
    }

    @GetMapping("/patients/{patientId}/observations")
    public List<Observation> getObservations(@PathVariable Long patientId) {
        return clinicalService.getObservationsByPatient(patientId);
    }

    // Conditions
    @PostMapping("/patients/{patientId}/conditions")
    public ResponseEntity<Condition> createCondition(
            @PathVariable Long patientId,
            @RequestBody ConditionRequest request) {
        Condition condition = clinicalService.createCondition(
                patientId, request.practitionerId, request.description);
        return ResponseEntity.ok(condition);
    }

    @GetMapping("/patients/{patientId}/conditions")
    public List<Condition> getConditions(@PathVariable Long patientId) {
        return clinicalService.getConditionsByPatient(patientId);
    }
}