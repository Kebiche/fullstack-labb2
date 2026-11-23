package com.journal.journal.repository;

import com.journal.journal.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findBySsNumber(String ssNumber);
    Optional<Patient> findByUserId(Long userId);
}