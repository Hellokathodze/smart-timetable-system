import { useEffect, useState } from "react";
import {
    fetchTimetable
} from "../services/api";

const BASE_URL = "http://localhost:8081";

const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");

const safeFetch = async (url) => {
    try {
        const token = getToken();
        if (!token) return null;

        const res = await fetch(`${BASE_URL}${url}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) return null; // silently fail — don't trigger logout

        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};

const Dashboard = () => {

    const [stats, setStats] = useState({
        teachers: 0,
        students: 0,
        subjects: 0,
        schedules: 0,
    });

    const role = getRole();

    useEffect(() => {

        const loadData = async () => {
            try {
                let teacherCount = 0;
                let studentCount = 0;
                let subjectCount = 0;
                let totalSchedules = 0;

                // Only ADMIN and FACULTY can access these endpoints
                if (role === "ADMIN" || role === "FACULTY") {
                    const teachersRes = await safeFetch("/teachers");
                    const subjectsRes = await safeFetch("/subjects");

                    const teachers = teachersRes?.data || teachersRes || [];
                    const subjects = subjectsRes?.data || subjectsRes || [];

                    teacherCount = Array.isArray(teachers) ? teachers.length : 0;
                    subjectCount = Array.isArray(subjects) ? subjects.length : 0;
                }

                // ALL roles can access students and schedule
                const studentsRes = await safeFetch("/students");
                const students = studentsRes?.data || studentsRes || [];
                studentCount = Array.isArray(students) ? students.length : 0;

                // Schedule — accessible by all
                const timetable = await fetchTimetable().catch(() => null);

                if (timetable) {
                    Object.keys(timetable).forEach((day) => {
                        if (Array.isArray(timetable[day])) {
                            totalSchedules += timetable[day].length;
                        }
                    });
                }

                setStats({
                    teachers: teacherCount,
                    students: studentCount,
                    subjects: subjectCount,
                    schedules: totalSchedules,
                });

            } catch (err) {
                console.error("Dashboard Error:", err);
            }
        };

        loadData();

    }, []);

    // Cards to show based on role
    const cards = [];

    if (role === "ADMIN" || role === "FACULTY") {
        cards.push({ label: "Total Teachers", value: stats.teachers, color: "bg-blue-500" });
    }

    cards.push({ label: "Total Students", value: stats.students, color: "bg-green-500" });

    if (role === "ADMIN" || role === "FACULTY") {
        cards.push({ label: "Total Subjects", value: stats.subjects, color: "bg-purple-500" });
    }

    cards.push({ label: "Total Schedules", value: stats.schedules, color: "bg-orange-500" });

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-sm text-gray-400 mb-6">
                {role === "STUDENT"
                    ? "Welcome! View your class schedule from the sidebar."
                    : role === "FACULTY"
                        ? "Welcome! Check your teaching schedule and class timetable."
                        : "Manage teachers, students, subjects, and schedules."}
            </p>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cards.length} gap-6`}>

                {cards.map((card, i) => (
                    <div key={i} className={`${card.color} text-white p-6 rounded-2xl shadow`}>
                        <h2 className="text-lg">{card.label}</h2>
                        <p className="text-3xl font-bold">{card.value}</p>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default Dashboard;