package com.journal.journal.service;

import com.journal.journal.entity.*;
import com.journal.journal.repository.*;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class JournalService {

    private final PatientRepository patientRepository;
    private final PractitionerRepository practitionerRepository;
    private final OrganizationRepository organizationRepository;
    private final LocationRepository locationRepository;

    public JournalService(PatientRepository patientRepository,
                          PractitionerRepository practitionerRepository,
                          OrganizationRepository organizationRepository,
                          LocationRepository locationRepository) {
        this.patientRepository = patientRepository;
        this.practitionerRepository = practitionerRepository;
        this.organizationRepository = organizationRepository;
        this.locationRepository = locationRepository;
    }

    // Patienter
    public List<Patient> getAllPatients() { return patientRepository.findAll(); }
    public Optional<Patient> getPatientById(Long id) { return patientRepository.findById(id); }
    public Patient savePatient(Patient patient) { return patientRepository.save(patient); }

    // Practitioners
    public List<Practitioner> getAllPractitioners() { return practitionerRepository.findAll(); }
    public Optional<Practitioner> getPractitionerById(Long id) { return practitionerRepository.findById(id); }
    public Practitioner savePractitioner(Practitioner practitioner) { return practitionerRepository.save(practitioner); }

    // Organisationer
    public List<Organization> getAllOrganizations() { return organizationRepository.findAll(); }
    public Organization saveOrganization(Organization organization) { return organizationRepository.save(organization); }

    // Platser
    public List<Location> getAllLocations() { return locationRepository.findAll(); }
    public Location saveLocation(Location location) { return locationRepository.save(location); }
}