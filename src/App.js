import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Cookies from "js-cookie";

import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StudentTranscript from "./pages/StudentTranscript";
import StudentDetails from "./pages/coordinator pages/StudentDetails";
import Grades from "./pages/Grades";

import PreRegistrationManagement from "./pages/coordinator pages/PreRegistrationManagementPage";
import EnrollmentStatsPage from "./pages/coordinator pages/EnrollmentStatsPage";
import Students from "./pages/coordinator pages/Students";
import ProgramCoursesManagement from "./pages/coordinator pages/ProgramCoursesMnagement";
import CourseStudentsPage from "./pages/coordinator pages/CourseStudentsPage";
import StaffManagement from "./pages/coordinator pages/StaffMnagement";
import AdvisingManagementPage from "./pages/coordinator pages/AdvisingManagementPage";
import AdvisingDetailsPage from "./pages/coordinator pages/AdvisingDetailsPage";
import Announcements from "./pages/coordinator pages/Announcements";


import StudentCourseOfferingsPage from "./pages/student pages/CourseOffering";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./pages/AppLayout";
import Profile from "./pages/Profile";
import "./App.css";

function App() {
  const token = Cookies.get("token");

  return (
    <Router>
      <Routes>

        {/* Login Route */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="transcript" element={<StudentTranscript />} />
          {/* <Route path="courses" element={<Courses />} /> */}

          <Route path="grades" element={<Grades />} />
          <Route path="registration" element={<StudentCourseOfferingsPage />} />
        </Route>

        {/* Staff Routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute role="staff">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path=":role/dashboard" element={<StaffDashboard />} />
          <Route path=":role/students" element={<Students />} />
          <Route path=":role/registration" element={<PreRegistrationManagement />} />
          <Route path=":role/enrollment-stats/:semesterId" element={<EnrollmentStatsPage />} />
          <Route path=":role/students/:id" element={<StudentDetails />} />
          <Route path=":role/program-courses" element={<ProgramCoursesManagement />} />
          <Route path=":role/ece-staff" element={<StaffManagement />} />
          <Route path=":role/semester/:semesterId/course/:courseId/students" element={<CourseStudentsPage />} />
          <Route path=":role/Advising-management" element={<AdvisingManagementPage />} />
          <Route path=":role/advising/details/:advisorId" element={<AdvisingDetailsPage />} />
          <Route path=":role/Anouncements" element={<Announcements />} />
          <Route path=":role/advise-students" element={<Announcements />} />

         


        </Route>



        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;