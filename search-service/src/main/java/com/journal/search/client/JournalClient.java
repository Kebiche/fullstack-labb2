package com.journal.search.client;

import io.smallrye.mutiny.Uni;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import java.util.List;

@Path("/api")
@RegisterRestClient
public interface JournalClient {

    @GET
    @Path("/patients")
    Uni<List<Patient>> getPatients();

    @GET
    @Path("/patients/{id}")
    Uni<Patient> getPatient(@PathParam("id") Long id);

    @GET
    @Path("/practitioners")
    Uni<List<Practitioner>> getPractitioners();

    @GET
    @Path("/patients/{patientId}/encounters")
    Uni<List<Encounter>> getEncountersByPatient(@PathParam("patientId") Long patientId);

    @GET
    @Path("/patients/{patientId}/conditions")
    Uni<List<Condition>> getConditionsByPatient(@PathParam("patientId") Long patientId);
}