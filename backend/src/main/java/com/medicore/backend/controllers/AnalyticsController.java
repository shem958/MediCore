package com.medicore.backend.controllers;

import com.medicore.backend.models.Role;
import com.medicore.backend.payload.response.AnalyticsDTO;
import com.medicore.backend.repositories.AppointmentRepository;
import com.medicore.backend.repositories.PatientRepository;
import com.medicore.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
public class AnalyticsController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PatientRepository patientRepository;

    @Autowired
    AppointmentRepository appointmentRepository;

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAnalytics() {
        long totalPatients = patientRepository.count();
        long totalDoctors = userRepository.countByRole(Role.DOCTOR);
        long totalAppointments = appointmentRepository.count();
        long appointmentsToday = appointmentRepository.countByScheduleAvailableDate(LocalDate.now());

        AnalyticsDTO analytics = new AnalyticsDTO(
                totalPatients,
                totalDoctors,
                totalAppointments,
                appointmentsToday
        );

        return ResponseEntity.ok(analytics);
    }
}
