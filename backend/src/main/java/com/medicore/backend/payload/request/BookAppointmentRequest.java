package com.medicore.backend.payload.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class BookAppointmentRequest {
    @NotNull
    private UUID scheduleId;

    private String reasonForVisit;

    public UUID getScheduleId() { return scheduleId; }
    public void setScheduleId(UUID scheduleId) { this.scheduleId = scheduleId; }
    public String getReasonForVisit() { return reasonForVisit; }
    public void setReasonForVisit(String reasonForVisit) { this.reasonForVisit = reasonForVisit; }
}
