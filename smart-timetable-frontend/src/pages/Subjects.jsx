import { useEffect, useState } from "react";
import {
    fetchSubjects,
    searchSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    fetchTeachers
} from "../services/api";

const Subjects = () => {

    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState("");

    const emptyForm = {
        code: "",
        name: "",
        branch: "",
        semester: "",
        teacherId: "",
        type: "THEORY"
    };

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    // =======================
    // LOAD DATA (🔥 FIXED)
    // =======================
    const loadData = async () => {
        try {
            const subjectData = search
                ? await searchSubjects(search)
                : await fetchSubjects();

            const teacherRes = await fetchTeachers();

            // 🔥 IMPORTANT FIX
            const teacherData = teacherRes?.data || teacherRes || [];

            setSubjects(subjectData || []);
            setTeachers(teacherData);

        } catch (err) {
            console.error(err);
            setSubjects([]);
            setTeachers([]);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const delay = setTimeout(loadData, 300);
        return () => clearTimeout(delay);
    }, [search]);

    // =======================
    // GET TEACHER NAME
    // =======================
    const getTeacherName = (id) => {
        const teacher = teachers.find(t => t.id === id);
        return teacher ? teacher.name : id;
    };

    // =======================
    // INPUT
    // =======================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });
    };

    // =======================
    // ADD / UPDATE (INSTANT UI)
    // =======================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...form,
            credits: 0,
            weeklyHours: 0,
            labRequired: false,
            maxStudents: 60
        };

        try {
            if (editingId) {
                await updateSubject(editingId, payload);

                setSubjects(prev =>
                    prev.map(s => s.id === editingId ? { ...s, ...payload } : s)
                );

                alert("Updated successfully");
            } else {
                const created = await addSubject(payload);

                setSubjects(prev => [created, ...prev]);

                alert("Added successfully");
            }

            setForm(emptyForm);
            setEditingId(null);

        } catch (err) {
            console.error(err);
            alert("Operation failed");
        }
    };

    // =======================
    // DELETE (INSTANT UI)
    // =======================
    const handleDelete = async (id) => {
        try {
            await deleteSubject(id);

            setSubjects(prev => prev.filter(s => s.id !== id));

            alert("Deleted successfully");

        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    // =======================
    // EDIT
    // =======================
    const handleEdit = (s) => {
        setForm({
            code: s.code,
            name: s.name,
            branch: s.branch,
            semester: s.semester,
            teacherId: s.teacherId,
            type: s.type || "THEORY"
        });

        setEditingId(s.id);
    };

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-4">Subjects</h1>

            {/* SEARCH */}
            <input
                placeholder="Search subject..."
                className="border p-2 mb-4 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* FORM */}
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2 mb-6">

                <input name="code" placeholder="Code" value={form.code} onChange={handleChange} className="border p-2" />
                <input name="name" placeholder="Name" value={form.name} onChange={handleChange} className="border p-2" />
                <input name="branch" placeholder="Branch" value={form.branch} onChange={handleChange} className="border p-2" />

                <input name="semester" placeholder="Semester" value={form.semester} onChange={handleChange} className="border p-2" />

                {/* 🔥 SAFE DROPDOWN */}
                <select name="teacherId" value={form.teacherId} onChange={handleChange} className="border p-2">
                    <option value="">Select Teacher</option>

                    {Array.isArray(teachers) && teachers.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>

                <input name="type" value="THEORY" readOnly className="border p-2 bg-gray-100" />

                <button className="bg-blue-500 text-white p-2 rounded col-span-3">
                    {editingId ? "Update" : "Add"}
                </button>
            </form>

            {/* TABLE */}
            <table className="w-full border">
                <thead>
                <tr className="bg-gray-200">
                    <th>Code</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Semester</th>
                    <th>Teacher</th>
                    <th>Actions</th>
                </tr>
                </thead>

                <tbody>
                {subjects.map((s) => (
                    <tr key={s.id} className="text-center border-t">
                        <td>{s.code}</td>
                        <td>{s.name}</td>
                        <td>{s.branch}</td>
                        <td>{s.semester}</td>
                        <td>{getTeacherName(s.teacherId)}</td>

                        <td className="space-x-2">
                            <button onClick={() => handleEdit(s)} className="bg-yellow-400 px-2 py-1 rounded">
                                Edit
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Subjects;