package com.medicore.backend.controllers;

import com.medicore.backend.models.Appointment;
import com.medicore.backend.models.Invoice;
import com.medicore.backend.models.Patient;
import com.medicore.backend.models.User;
import com.medicore.backend.payload.request.CreateInvoiceRequest;
import com.medicore.backend.payload.response.InvoiceDTO;
import com.medicore.backend.payload.response.MessageResponse;
import com.medicore.backend.repositories.AppointmentRepository;
import com.medicore.backend.repositories.InvoiceRepository;
import com.medicore.backend.repositories.PatientRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired
    InvoiceRepository invoiceRepository;

    @Autowired
    AppointmentRepository appointmentRepository;

    @Autowired
    PatientRepository patientRepository;

    @PostMapping("/")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<?> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        Optional<Appointment> appOpt = appointmentRepository.findById(request.getAppointmentId());
        if (appOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Appointment not found"));
        }

        Appointment appointment = appOpt.get();

        Invoice invoice = new Invoice(
                appointment.getPatient(),
                appointment,
                request.getAmount(),
                "UNPAID",
                LocalDate.now(),
                request.getDueDate()
        );

        invoiceRepository.save(invoice);

        return ResponseEntity.ok(new MessageResponse("Invoice created successfully"));
    }

    @GetMapping("/unpaid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUnpaidInvoices() {
        // Fetch UNPAID and OVERDUE
        List<Invoice> invoices = invoiceRepository.findByStatusInOrderByDueDateAsc(Arrays.asList("UNPAID", "OVERDUE"));
        return ResponseEntity.ok(mapToDTO(invoices));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyInvoices() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User userDetails = (User) authentication.getPrincipal();

        Optional<Patient> patientOpt = patientRepository.findByUser(userDetails);
        if (patientOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Patient profile not found."));
        }

        List<Invoice> invoices = invoiceRepository.findByPatientIdOrderByIssuedDateDesc(patientOpt.get().getId());
        return ResponseEntity.ok(mapToDTO(invoices));
    }

    @Autowired
    com.medicore.backend.services.EmailService emailService;

    @PutMapping("/{id}/pay")
    @PreAuthorize("hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<?> simulatePayment(@PathVariable UUID id) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findById(id);
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invoice not found"));
        }

        Invoice invoice = invoiceOpt.get();
        if (invoice.getStatus().equals("PAID")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invoice is already paid"));
        }

        invoice.setStatus("PAID");
        invoiceRepository.save(invoice);

        // Send Email
        String emailBody = String.format("Dear %s,\n\nWe have successfully received your payment of $%s for your appointment with Dr. %s on %s.\n\nThank you for choosing MediCore Hospital.",
                invoice.getPatient().getUser().getFirstName(),
                invoice.getAmount().toString(),
                invoice.getAppointment().getDoctor().getLastName(),
                invoice.getAppointment().getSchedule().getAvailableDate().toString());
                
        emailService.sendEmail(invoice.getPatient().getUser().getEmail(), "Payment Receipt", emailBody);

        return ResponseEntity.ok(new MessageResponse("Payment successful!"));
    }

    @PostMapping("/mpesa/stk-push")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> simulateMpesaStkPush(@Valid @RequestBody com.medicore.backend.payload.request.MpesaPaymentRequest request) {
        Optional<Invoice> invoiceOpt = invoiceRepository.findById(request.getInvoiceId());
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invoice not found"));
        }

        Invoice invoice = invoiceOpt.get();
        if (invoice.getStatus().equals("PAID")) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invoice is already paid"));
        }

        // Simulate successful STK Push processing delay and success
        invoice.setStatus("PAID");
        invoice.setPaymentMethod("M-PESA");
        invoiceRepository.save(invoice);

        // Send Email
        String emailBody = String.format("Dear %s,\n\nWe have successfully received your M-PESA payment of KES %s for your appointment with Dr. %s on %s.\n\nThank you for choosing MediCore Hospital.",
                invoice.getPatient().getUser().getFirstName(),
                invoice.getAmount().toString(),
                invoice.getAppointment().getDoctor().getLastName(),
                invoice.getAppointment().getSchedule().getAvailableDate().toString());
                
        emailService.sendEmail(invoice.getPatient().getUser().getEmail(), "M-PESA Payment Receipt", emailBody);

        return ResponseEntity.ok(new MessageResponse("M-Pesa Payment successful!"));
    }

    private List<InvoiceDTO> mapToDTO(List<Invoice> invoices) {
        return invoices.stream().map(inv -> {
            InvoiceDTO dto = new InvoiceDTO();
            dto.setId(inv.getId());
            dto.setPatientName(inv.getPatient().getUser().getFirstName() + " " + inv.getPatient().getUser().getLastName());
            dto.setPatientEmail(inv.getPatient().getUser().getEmail());
            dto.setDoctorName("Dr. " + inv.getAppointment().getDoctor().getLastName());
            dto.setAppointmentDate(inv.getAppointment().getSchedule().getAvailableDate());
            dto.setAmount(inv.getAmount());
            dto.setStatus(inv.getStatus());
            dto.setIssuedDate(inv.getIssuedDate());
            dto.setDueDate(inv.getDueDate());
            return dto;
        }).collect(Collectors.toList());
    }
}
