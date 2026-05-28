import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "@/Components/Layout/Layout";
import NotFound from "@/Components/Shared/NotFound";
import Landing from "@/views/Landing";

import PatientHome from "@/views/patient/PatientHome";
import PatientRegister from "@/views/patient/PatientRegister";
import PatientDoctors from "@/views/patient/PatientDoctors";
import PatientDoctorAvailability from "@/views/patient/PatientDoctorAvailability";
import PatientAppointments from "@/views/patient/PatientAppointments";
import PatientNotifications from "@/views/patient/PatientNotifications";

import DoctorDashboard from "@/views/doctor/DoctorDashboard";
import DoctorSchedule from "@/views/doctor/DoctorSchedule";
import DoctorSettings from "@/views/doctor/DoctorSettings";

import AdminHome from "@/views/admin/AdminHome";
import AdminClinics from "@/views/admin/AdminClinics";
import AdminDoctors from "@/views/admin/AdminDoctors";
import AdminPolicy from "@/views/admin/AdminPolicy";
import AdminAnalytics from "@/views/admin/AdminAnalytics";
import AdminAudit from "@/views/admin/AdminAudit";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />

        <Route path="patient" element={<PatientHome />} />
        <Route path="patient/register" element={<PatientRegister />} />
        <Route path="patient/doctors" element={<PatientDoctors />} />
        <Route path="patient/doctors/:doctorId" element={<PatientDoctorAvailability />} />
        <Route path="patient/appointments" element={<PatientAppointments />} />
        <Route path="patient/notifications" element={<PatientNotifications />} />

        <Route path="doctor" element={<DoctorDashboard />} />
        <Route path="doctor/schedule" element={<DoctorSchedule />} />
        <Route path="doctor/settings" element={<DoctorSettings />} />

        <Route path="admin" element={<AdminHome />} />
        <Route path="admin/clinics" element={<AdminClinics />} />
        <Route path="admin/doctors" element={<AdminDoctors />} />
        <Route path="admin/policy" element={<AdminPolicy />} />
        <Route path="admin/analytics" element={<AdminAnalytics />} />
        <Route path="admin/audit" element={<AdminAudit />} />

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
