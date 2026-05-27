package com.medicore.backend.repositories;

import com.medicore.backend.models.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, UUID> {
    List<DoctorSchedule> findByDoctorIdAndAvailableDateGreaterThanEqualOrderByAvailableDateAscStartTimeAsc(UUID doctorId, LocalDate date);
    List<DoctorSchedule> findByDoctorIdAndAvailableDateOrderByStartTimeAsc(UUID doctorId, LocalDate date);
    List<DoctorSchedule> findByAvailableDateGreaterThanEqualAndIsBookedFalseOrderByAvailableDateAscStartTimeAsc(LocalDate date);
}
