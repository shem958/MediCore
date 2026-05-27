package com.medicore.backend.controllers;

import com.medicore.backend.models.MedicalRecord;
import com.medicore.backend.models.Patient;
import com.medicore.backend.models.User;
import com.medicore.backend.payload.request.CreateMedicalRecordRequest;
import com.medicore.backend.payload.response.MedicalRecordDTO;
import com.medicore.backend.payload.response.MessageResponse;
import com.medicore.backend.repositories.MedicalRecordRepository;
import com.medicore.backend.repositories.PatientRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {

    @Autowired
    MedicalRecordRepository medicalRecordRepository;

    @Autowired
    PatientRepository patientRepository;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT')")
    public ResponseEntity<?> getRecordsByPatient(@PathVariable UUID patientId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User userDetails = (User) authentication.getPrincipal();

        // Security check: if role is PATIENT, ensure they are requesting their own records
        if (userDetails.getRole().name().equals("PATIENT")) {
            Optional<Patient> patientOpt = patientRepository.findByUser(userDetails);
            if (patientOpt.isEmpty() || !patientOpt.get().getId().equals(patientId)) {
                return ResponseEntity.status(403).body(new MessageResponse("Unauthorized to view these records"));
            }
        }

        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        
        List<MedicalRecordDTO> dtos = records.stream().map(record -> {
            MedicalRecordDTO dto = new MedicalRecordDTO();
            dto.setId(record.getId());
            dto.setDoctorName("Dr. " + record.getDoctor().getLastName());
            dto.setDiagnosis(record.getDiagnosis());
            dto.setPrescription(record.getPrescription());
            dto.setNotes(record.getNotes());
            dto.setAttachmentUrl(record.getAttachmentUrl());
            dto.setCreatedAt(record.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createRecord(@Valid @RequestBody CreateMedicalRecordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User doctor = (User) authentication.getPrincipal();

        Optional<Patient> patientOpt = patientRepository.findById(request.getPatientId());
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Patient not found"));
        }

        MedicalRecord record = new MedicalRecord(
                patientOpt.get(),
                doctor,
                request.getDiagnosis(),
                request.getPrescription(),
                request.getNotes()
        );
        record.setAttachmentUrl(request.getAttachmentUrl());

        medicalRecordRepository.save(record);

        return ResponseEntity.ok(new MessageResponse("Medical record created successfully!"));
    }
}
