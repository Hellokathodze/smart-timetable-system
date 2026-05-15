import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import Rooms from "./pages/Rooms";
import Timeslots from "./pages/Timeslots";
import Analytics from "./pages/Analytics";
import MySchedule from "./pages/MySchedule";
import ChangePassword from "./pages/ChangePassword";
import Messages from "./pages/Messages";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />

                <Route path="teachers" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Teachers /></ProtectedRoute>} />
                <Route path="students" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Students /></ProtectedRoute>} />
                <Route path="subjects" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Subjects /></ProtectedRoute>} />
                <Route path="rooms" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Rooms /></ProtectedRoute>} />
                <Route path="timeslots" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Timeslots /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Analytics /></ProtectedRoute>} />

                <Route path="schedule" element={<ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}><Schedule /></ProtectedRoute>} />
                <Route path="my-schedule" element={<ProtectedRoute allowedRoles={["FACULTY", "STUDENT"]}><MySchedule /></ProtectedRoute>} />
                <Route path="change-password" element={<ProtectedRoute allowedRoles={["ADMIN", "FACULTY", "STUDENT"]}><ChangePassword /></ProtectedRoute>} />

                {/* ✅ Messages — ADMIN + FACULTY */}
                <Route path="messages" element={<ProtectedRoute allowedRoles={["ADMIN", "FACULTY"]}><Messages /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default App;