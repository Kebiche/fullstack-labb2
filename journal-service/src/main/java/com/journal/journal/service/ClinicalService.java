package com.journal.journal.service;

import com.journal.journal.entity.*;
import com.journal.journal.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ClinicalService {

    private final EncounterRepository encounterRepository;
    private final ObservationRepository observationRepository;
    private final ConditionRepository conditionRepository;
    private final PatientRepository patientRepository;
    private final PractitionerRepository practitionerRepository;
    private final LocationRepository locationRepository;

    public ClinicalService(EncounterRepository encounterRepository,
                           ObservationRepository observationRepository,
                           ConditionRepository conditionRepository,
                           PatientRepository patientRepository,
                           PractitionerRepository practitionerRepository,
                           LocationRepository locationRepository) {
        this.encounterRepository = encounterRepository;
        this.observationRepository = observationRepository;
        this.conditionRepository = conditionRepository;
        this.patientRepository = patientRepository;
        this.practitionerRepository = practitionerRepository;
        this.locationRepository = locationRepository;
    }

    // Encounters
    public Encounter createEncounter(Long patientId, Long practitionerId, Long locationId, String description) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Practitioner practitioner = practitionerRepository.findById(practitionerId)
                .orElseThrow(() -> new RuntimeException("Practitioner not found"));
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found"));

        Encounter encounter = new Encounter(LocalDate.now(), description, patient, practitioner, location);
        return encounterRepository.save(encounter);
    }

    public List<Encounter> getEncountersByPatient(Long patientId) {
        return encounterRepository.findByPatientId(patientId);
    }

    // Observations
    public Observation createObservation(Long patientId, Long practitionerId, Long encounterId, String note) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Practitioner practitioner = practitionerRepository.findById(practitionerId)
                .orElseThrow(() -> new RuntimeException("Practitioner not found"));
        Encounter encounter = encounterRepository.findById(encounterId)
                .orElseThrow(() -> new RuntimeException("Encounter not found"));

        Observation observation = new Observation(LocalDate.now(), note, practitioner, patient, encounter);
        return observationRepository.save(observation);
    }

    public List<Observation> getObservationsByPatient(Long patientId) {
        return observationRepository.findByPatientId(patientId);
    }

    // Conditions
    public Condition createCondition(Long patientId, Long practitionerId, String description) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Practitioner practitioner = practitionerRepository.findById(practitionerId)
                .orElseThrow(() -> new RuntimeException("Practitioner not found"));

        Condition condition = new Condition(description, patient, practitioner);
        return conditionRepository.save(condition);
    }

    public List<Condition> getConditionsByPatient(Long patientId) {
        return conditionRepository.findByPatientId(patientId);
    }
}