package com.medicore.backend.controllers;

import com.medicore.backend.models.Patient;
import com.medicore.backend.models.User;
import com.medicore.backend.payload.response.PatientDTO;
import com.medicore.backend.repositories.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    PatientRepository patientRepository;

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User userDetails = (User) authentication.getPrincipal();

        Optional<Patient> patientOpt = patientRepository.findByUser(userDetails);
        
        if (patientOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Patient patient = patientOpt.get();
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setFirstName(userDetails.getFirstName());
        dto.setLastName(userDetails.getLastName());
        dto.setEmail(userDetails.getEmail());
        dto.setDateOfBirth(patient.getDateOfBirth());
        dto.setBloodGroup(patient.getBloodGroup());
        dto.setContactNumber(patient.getContactNumber());
        dto.setAddress(patient.getAddress());

        return ResponseEntity.ok(dto);
    }
}
