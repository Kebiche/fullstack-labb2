package com.journal.journal.repository;

import com.journal.journal.entity.Observation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ObservationRepository extends JpaRepository<Observation, Long> {
    List<Observation> findByPatientId(Long patientId);
    List<Observation> findByEncounterId(Long encounterId);
}