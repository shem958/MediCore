package com.medicore.backend.payload.response;

public class AnalyticsDTO {
    private long totalPatients;
    private long totalDoctors;
    private long totalAppointments;
    private long appointmentsToday;

    public AnalyticsDTO(long totalPatients, long totalDoctors, long totalAppointments, long appointmentsToday) {
        this.totalPatients = totalPatients;
        this.totalDoctors = totalDoctors;
        this.totalAppointments = totalAppointments;
        this.appointmentsToday = appointmentsToday;
    }

    // Getters and Setters
    public long getTotalPatients() { return totalPatients; }
    public void setTotalPatients(long totalPatients) { this.totalPatients = totalPatients; }
    public long getTotalDoctors() { return totalDoctors; }
    public void setTotalDoctors(long totalDoctors) { this.totalDoctors = totalDoctors; }
    public long getTotalAppointments() { return totalAppointments; }
    public void setTotalAppointments(long totalAppointments) { this.totalAppointments = totalAppointments; }
    public long getAppointmentsToday() { return appointmentsToday; }
    public void setAppointmentsToday(long appointmentsToday) { this.appointmentsToday = appointmentsToday; }
}
