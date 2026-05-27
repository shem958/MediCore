package com.medicore.backend.repositories;

import com.medicore.backend.models.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByStatusOrderByDueDateAsc(String status);
    List<Invoice> findByStatusInOrderByDueDateAsc(List<String> statuses);
    List<Invoice> findByPatientIdOrderByIssuedDateDesc(UUID patientId);
}
