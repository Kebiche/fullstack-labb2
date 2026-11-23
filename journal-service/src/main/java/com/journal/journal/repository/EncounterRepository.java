package com.journal.journal.repository;

import com.journal.journal.entity.Encounter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EncounterRepository extends JpaRepository<Encounter, Long> {
    List<Encounter> findByPatientId(Long patientId);
    List<Encounter> findByPractitionerId(Long practitionerId);
}