import { useEffect, useState } from "react";

const API = "http://localhost:8081/teachers";

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        department: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [editingFull, setEditingFull] = useState(null); // ✅ Store full teacher object for edit
    const [bulkMsg, setBulkMsg] = useState("");

    const authFetch = async (url, options = {}) => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        return await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });
    };

    const fetchTeachers = async () => {
        let url = API;
        if (search) url = `${API}/search?name=${search}`;

        const res = await authFetch(url);
        if (!res) return;
        let result = {};
        try { result = await res.json(); } catch { result = {}; }
        setTeachers(result.data || result || []);
    };

    useEffect(() => { fetchTeachers(); }, []);

    useEffect(() => {
        const delay = setTimeout(fetchTeachers, 300);
        return () => clearTimeout(delay);
    }, [search]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let res;

        if (editingId) {
            // ✅ Merge form changes with full original teacher data
            const payload = {
                ...editingFull,       // preserve canGenerate, subjects, availability, etc.
                name: form.name,
                email: form.email,
                department: form.department,
            };

            res = await authFetch(`${API}/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
        } else {
            res = await authFetch(API, {
                method: "POST",
                body: JSON.stringify(form),
            });
        }

        if (!res) return;
        let data = {};
        try { data = await res.json(); } catch { data.message = "Success"; }
        alert(data.message || "Success");

        setForm({ name: "", email: "", department: "" });
        setEditingId(null);
        setEditingFull(null);

        // ✅ Force fresh fetch with cache bust
        setTimeout(fetchTeachers, 200);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this teacher?")) return;
        const res = await authFetch(`${API}/${id}`, { method: "DELETE" });
        if (!res) return;
        alert("Teacher deleted");
        fetchTeachers();
    };

    const handleEdit = (teacher) => {
        setForm({
            name: teacher.name || "",
            email: teacher.email || "",
            department: teacher.department || "",
        });
        setEditingId(teacher.id);
        setEditingFull(teacher);  // ✅ Store full object
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

    const handleToggleGenerate = async (teacherId, currentValue) => {
        const res = await authFetch(`${API}/${teacherId}/toggle-generate`, {
            method: "PUT",
            body: JSON.stringify({ canGenerate: !currentValue }),
        });
        if (!res) return;
        fetchTeachers();
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;
        const regex = new RegExp(`(${query})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-300 px-1 rounded">{part}</span>
            ) : (part)
        );
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Teachers</h1>
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

            <input
                type="text"
                placeholder="Search by name..."
                className="border p-2 mb-4 w-full rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <form onSubmit={handleSubmit} className="mb-6 space-x-2">
                <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="border p-2 rounded" />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded" />
                <input name="department" placeholder="Department" value={form.department} onChange={handleChange} className="border p-2 rounded" />
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                    {editingId ? "Update" : "Add"}
                </button>
                {editingId && (
                    <button type="button" onClick={() => { setForm({ name: "", email: "", department: "" }); setEditingId(null); setEditingFull(null); }}
                            className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                )}
            </form>

            {!editingId && (
                <p className="text-xs text-gray-400 mb-4 -mt-4">
                    New teachers get a login account automatically (default password: <strong>password123</strong>)
                </p>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-3 text-sm font-semibold">Name</th>
                        <th className="p-3 text-sm font-semibold">Email</th>
                        <th className="p-3 text-sm font-semibold">Department</th>
                        <th className="p-3 text-sm font-semibold text-center">Head Teacher</th>
                        <th className="p-3 text-sm font-semibold text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {teachers.map((t) => (
                        <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-sm">{highlightText(t.name, search)}</td>
                            <td className="p-3 text-sm text-gray-500">{highlightText(t.email, search)}</td>
                            <td className="p-3 text-sm">{highlightText(t.department, search)}</td>
                            <td className="p-3 text-center">
                                <button
                                    onClick={() => handleToggleGenerate(t.id, t.canGenerate)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                        t.canGenerate ? "bg-indigo-600" : "bg-gray-300"
                                    }`}
                                    title={t.canGenerate ? "Revoke generate access" : "Grant generate access"}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
                                        t.canGenerate ? "translate-x-6" : "translate-x-1"
                                    }`} />
                                </button>
                            </td>
                            <td className="p-3 text-center space-x-2">
                                <button onClick={() => handleEdit(t)} className="bg-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500">Edit</button>
                                <button onClick={() => handleDelete(t.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Teachers;