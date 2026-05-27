package com.medicore.backend.controllers;

import com.medicore.backend.models.DoctorSchedule;
import com.medicore.backend.models.User;
import com.medicore.backend.payload.request.CreateScheduleRequest;
import com.medicore.backend.payload.response.DoctorScheduleDTO;
import com.medicore.backend.payload.response.MessageResponse;
import com.medicore.backend.repositories.DoctorScheduleRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    DoctorScheduleRepository doctorScheduleRepository;

    @PostMapping("/")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> addScheduleSlot(@Valid @RequestBody CreateScheduleRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User doctor = (User) authentication.getPrincipal();

        DoctorSchedule schedule = new DoctorSchedule(
                doctor,
                request.getAvailableDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        doctorScheduleRepository.save(schedule);

        return ResponseEntity.ok(new MessageResponse("Schedule slot added successfully"));
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public ResponseEntity<?> getAvailableSlots() {
        // Fetch all unbooked slots from today onwards
        List<DoctorSchedule> schedules = doctorScheduleRepository
                .findByAvailableDateGreaterThanEqualAndIsBookedFalseOrderByAvailableDateAscStartTimeAsc(LocalDate.now());

        List<DoctorScheduleDTO> dtos = schedules.stream().map(schedule -> {
            DoctorScheduleDTO dto = new DoctorScheduleDTO();
            dto.setId(schedule.getId());
            dto.setDoctorName("Dr. " + schedule.getDoctor().getLastName());
            dto.setAvailableDate(schedule.getAvailableDate());
            dto.setStartTime(schedule.getStartTime());
            dto.setEndTime(schedule.getEndTime());
            dto.setBooked(schedule.isBooked());
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
