import { useEffect, useState } from "react";

const API = "http://localhost:8081/students";

const Students = () => {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        rollNo: "",
        branch: "",
        division: "",
        semester: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [bulkMsg, setBulkMsg] = useState("");

    const authFetch = async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
        return res;
    };

    const fetchStudents = async () => {
        let url = API;
        if (search) url = `${API}/search?name=${search}`;

        const res = await authFetch(url);
        if (!res) return;

        try {
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : data.data || []);
        } catch {
            setStudents([]);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        const delay = setTimeout(fetchStudents, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...form,
            rollNo: parseInt(form.rollNo) || 0,
        };

        let res;
        if (editingId) {
            res = await authFetch(`${API}/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            res = await authFetch(API, {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }

        if (!res) return;

        const msg = editingId
            ? "Student updated successfully"
            : "Student added (login created with default password: password123)";
        alert(msg);

        setForm({ name: "", email: "", rollNo: "", branch: "", division: "", semester: "" });
        setEditingId(null);
        fetchStudents();
    };

    const handleEdit = (s) => {
        setForm({
            name: s.name || "",
            email: s.email || "",
            rollNo: s.rollNo?.toString() || "",
            branch: s.branch || "",
            division: s.division || "",
            semester: s.semester || "",
        });
        setEditingId(s.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this student?")) return;

        const res = await authFetch(`${API}/${id}`, { method: "DELETE" });
        if (!res) return;
        alert("Student deleted");
        fetchStudents();
    };

    const handleBulkCreateLogins = async () => {
        setBulkMsg("");
        const res = await authFetch(`${API}/create-logins`, { method: "POST" });
        if (!res) return;

        try {
            const data = await res.json();
            setBulkMsg(`Created ${data.count} login account(s) with default password: password123`);
        } catch {
            setBulkMsg("Login creation completed");
        }
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;
        const regex = new RegExp(`(${query})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 px-0.5 rounded">{part}</span>
            ) : (
                part
            )
        );
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Students</h1>
                <button
                    onClick={handleBulkCreateLogins}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    Create Logins for All
                </button>
            </div>

            {bulkMsg && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                    {bulkMsg}
                </div>
            )}

            {/* SEARCH */}
            <input
                type="text"
                placeholder="Search by name..."
                className="border p-2 mb-4 w-full rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="border p-2 rounded-lg" required />
                    <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} className="border p-2 rounded-lg" required />
                    <input name="rollNo" placeholder="Roll No" type="number" value={form.rollNo} onChange={handleChange} className="border p-2 rounded-lg" required />
                    <input name="branch" placeholder="Branch (e.g. CE)" value={form.branch} onChange={handleChange} className="border p-2 rounded-lg" />
                    <input name="division" placeholder="Division (e.g. A)" value={form.division} onChange={handleChange} className="border p-2 rounded-lg" />
                    <input name="semester" placeholder="Semester (e.g. SEM-4)" value={form.semester} onChange={handleChange} className="border p-2 rounded-lg" />
                </div>

                <div className="flex gap-2 mt-3">
                    <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        {editingId ? "Update" : "Add Student"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => {
                                setForm({ name: "", email: "", rollNo: "", branch: "", division: "", semester: "" });
                                setEditingId(null);
                            }}
                            className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {!editingId && (
                    <p className="text-xs text-gray-400 mt-2">
                        Login account will be auto-created with default password: <strong>password123</strong>
                    </p>
                )}
            </form>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-50 border-b text-left">
                        <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Roll No</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Branch</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Division</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Semester</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {students.length > 0 ? (
                        students.map((s) => (
                            <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-sm">{highlightText(s.name, search)}</td>
                                <td className="p-3 text-sm text-gray-500">{s.email}</td>
                                <td className="p-3 text-sm">{s.rollNo}</td>
                                <td className="p-3 text-sm">{s.branch}</td>
                                <td className="p-3 text-sm">{s.division}</td>
                                <td className="p-3 text-sm">{s.semester}</td>
                                <td className="p-3 space-x-2">
                                    <button onClick={() => handleEdit(s)} className="bg-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="text-center p-6 text-gray-400">
                                No students found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Students;