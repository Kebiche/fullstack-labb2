package com.journal.search.resource;

import com.journal.search.client.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import java.util.List;
import java.util.stream.Collectors;

@Path("/api/search")
public class SearchResource {

    @Inject
    @RestClient
    JournalClient journalClient;

    @GET
    @Path("/patients")
    public Uni<List<Patient>> searchPatients(@QueryParam("name") String name) {
        return journalClient.getPatients()
                .onItem().transform(patients ->
                        patients.stream()
                                .filter(p -> name == null || p.name.toLowerCase().contains(name.toLowerCase()))
                                .collect(Collectors.toList())
                );
    }

    @GET
    @Path("/practitioners")
    public Uni<List<Practitioner>> searchPractitioners(@QueryParam("name") String name) {
        return journalClient.getPractitioners()
                .onItem().transform(practitioners ->
                        practitioners.stream()
                                .filter(p -> name == null || p.name.toLowerCase().contains(name.toLowerCase()))
                                .collect(Collectors.toList())
                );
    }

    @GET
    @Path("/patients/{patientId}/encounters")
    public Uni<List<Encounter>> getEncounters(@PathParam("patientId") Long patientId) {
        return journalClient.getEncountersByPatient(patientId);
    }

    @GET
    @Path("/patients/{patientId}/conditions")
    public Uni<List<Condition>> getConditions(@PathParam("patientId") Long patientId) {
        return journalClient.getConditionsByPatient(patientId);
    }
}