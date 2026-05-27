package com.medicore.backend.controllers;

import com.medicore.backend.models.Appointment;
import com.medicore.backend.models.DoctorSchedule;
import com.medicore.backend.models.Patient;
import com.medicore.backend.models.User;
import com.medicore.backend.payload.request.BookAppointmentRequest;
import com.medicore.backend.payload.response.AppointmentDTO;
import com.medicore.backend.payload.response.MessageResponse;
import com.medicore.backend.repositories.AppointmentRepository;
import com.medicore.backend.repositories.DoctorScheduleRepository;
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
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    AppointmentRepository appointmentRepository;

    @Autowired
    DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    PatientRepository patientRepository;

    @Autowired
    com.medicore.backend.services.EmailService emailService;

    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookAppointment(@Valid @RequestBody BookAppointmentRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User userDetails = (User) authentication.getPrincipal();

        Optional<Patient> patientOpt = patientRepository.findByUser(userDetails);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Patient profile not found."));
        }

        Optional<DoctorSchedule> scheduleOpt = doctorScheduleRepository.findById(request.getScheduleId());
        if (scheduleOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Schedule not found."));
        }

        DoctorSchedule schedule = scheduleOpt.get();

        if (schedule.isBooked()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: This slot is already booked."));
        }

        Patient patient = patientOpt.get();

        Appointment appointment = new Appointment(
                patient,
                schedule.getDoctor(),
                schedule,
                "SCHEDULED",
                request.getReasonForVisit()
        );

        appointmentRepository.save(appointment);

        schedule.setBooked(true);
        doctorScheduleRepository.save(schedule);

        // Send Email
        String emailBody = String.format("Dear %s,\n\nYour appointment with Dr. %s has been successfully booked for %s.\n\nPlease arrive 15 minutes early.\n\nRegards,\nMediCore Hospital",
                patient.getUser().getFirstName(),
                schedule.getDoctor().getLastName(),
                schedule.getAvailableDate().toString());
                
        emailService.sendEmail(patient.getUser().getEmail(), "Appointment Confirmed", emailBody);

        return ResponseEntity.ok(new MessageResponse("Appointment booked successfully!"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User userDetails = (User) authentication.getPrincipal();

        Optional<Patient> patientOpt = patientRepository.findByUser(userDetails);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Patient profile not found."));
        }

        List<Appointment> appointments = appointmentRepository.findByPatientIdOrderByScheduleAvailableDateDesc(patientOpt.get().getId());
        return ResponseEntity.ok(mapToDTO(appointments));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User doctor = (User) authentication.getPrincipal();

        List<Appointment> appointments = appointmentRepository.findByDoctorIdOrderByScheduleAvailableDateDesc(doctor.getId());
        return ResponseEntity.ok(mapToDTO(appointments));
    }

    private List<AppointmentDTO> mapToDTO(List<Appointment> appointments) {
        return appointments.stream().map(app -> {
            AppointmentDTO dto = new AppointmentDTO();
            dto.setId(app.getId());
            dto.setPatientName(app.getPatient().getUser().getFirstName() + " " + app.getPatient().getUser().getLastName());
            dto.setDoctorName("Dr. " + app.getDoctor().getLastName());
            dto.setAppointmentDate(app.getSchedule().getAvailableDate());
            dto.setStartTime(app.getSchedule().getStartTime());
            dto.setEndTime(app.getSchedule().getEndTime());
            dto.setStatus(app.getStatus());
            dto.setReasonForVisit(app.getReasonForVisit());
            return dto;
        }).collect(Collectors.toList());
    }
}
