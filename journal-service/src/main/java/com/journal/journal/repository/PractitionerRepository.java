package com.journal.journal.repository;

import com.journal.journal.entity.Practitioner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PractitionerRepository extends JpaRepository<Practitioner, Long> {
    Optional<Practitioner> findByUserId(Long userId);
}