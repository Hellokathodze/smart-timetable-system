const BASE_URL = "http://localhost:8081";

// =======================
// TOKEN
// =======================
const getToken = () => localStorage.getItem("token");

// =======================
// AUTH FETCH (GLOBAL)
// =======================
const authFetch = async (url, options = {}) => {
    const token = getToken();

    if (!token) {
        console.error("No token found. Please login.");
        throw new Error("Unauthorized");
    }

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!res.ok) {
        console.error("API Error:", res.status);

        if (res.status === 401) {
            localStorage.removeItem("token");
            alert("Session expired. Please login again.");
            window.location.href = "/login";
        }

        throw new Error(`Request failed with status ${res.status}`);
    }

    const text = await res.text();

    try {
        return text ? JSON.parse(text) : {};
    } catch {
        return text;
    }
};

// =======================
// TEACHERS
// =======================
export const fetchTeachers = () => authFetch("/teachers");

export const searchTeachers = (name) =>
    authFetch(`/teachers/search?name=${encodeURIComponent(name)}`);

export const addTeacher = (data) =>
    authFetch("/teachers", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateTeacher = (id, data) =>
    authFetch(`/teachers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteTeacher = (id) =>
    authFetch(`/teachers/${id}`, {
        method: "DELETE",
    });

// =======================
// STUDENTS
// =======================
export const fetchStudents = () => authFetch("/students");

// =======================
// SUBJECTS
// =======================
export const fetchSubjects = () => authFetch("/subjects");

export const searchSubjects = (name) =>
    authFetch(`/subjects/search?name=${encodeURIComponent(name)}`);

export const addSubject = (data) =>
    authFetch("/subjects", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateSubject = (id, data) =>
    authFetch(`/subjects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteSubject = (id) =>
    authFetch(`/subjects/${id}`, {
        method: "DELETE",
    });

// =======================
// ROOMS
// =======================
export const fetchRooms = () => authFetch("/rooms");

export const addRoom = (data) =>
    authFetch("/rooms", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateRoom = (id, data) =>
    authFetch(`/rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteRoom = (id) =>
    authFetch(`/rooms/${id}`, {
        method: "DELETE",
    });

// =======================
// TIMESLOTS (FULL CRUD)
// =======================
export const fetchTimeslots = () => authFetch("/timeslots");

export const addTimeslot = (data) =>
    authFetch("/timeslots", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateTimeslot = (id, data) =>
    authFetch(`/timeslots/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

export const deleteTimeslot = (id) =>
    authFetch(`/timeslots/${id}`, {
        method: "DELETE",
    });

// SEARCH TIMESLOTS
export const searchTimeslotsByDay = (day) =>
    authFetch(`/timeslots/day/${encodeURIComponent(day)}`);

export const searchTimeslotsByType = (type) =>
    authFetch(`/timeslots/type/${encodeURIComponent(type)}`);

// GENERATE TIMESLOTS
export const generateTimeslots = () =>
    authFetch("/timeslots/generate", {
        method: "POST",
    });

// =======================
// TIMETABLE
// =======================
export const fetchTimetable = () =>
    authFetch("/schedule/timetable?branch=CE&division=A");

// =======================
// AI GENERATE
// =======================
export const generateTimetable = () =>
    authFetch("/ai/generate", {
        method: "POST",
    });