ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_employeeId_appointmentDate_time_key" UNIQUE ("employeeId", "appointmentDate", "time");
