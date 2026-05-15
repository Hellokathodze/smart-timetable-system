import { useEffect, useState } from "react";
import {
    fetchTimeslots,
    addTimeslot,
    updateTimeslot,
    deleteTimeslot
} from "../services/api";

const Timeslots = () => {

    const [timeslots, setTimeslots] = useState([]);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        id: "",
        day: "",
        slotNumber: "",
        startTime: "",
        endTime: "",
        type: "LECTURE"
    });

    const [isEditing, setIsEditing] = useState(false);

    // ======================
    // LOAD DATA
    // ======================
    const loadTimeslots = async () => {
        try {
            const data = await fetchTimeslots();
            setTimeslots(data || []);
        } catch (err) {
            console.error("Error fetching timeslots:", err);
        }
    };

    useEffect(() => {
        loadTimeslots();
    }, []);

    // ======================
    // HANDLE INPUT
    // ======================
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ======================
    // ADD / UPDATE (🔥 FIXED)
    // ======================
    const handleSubmit = async () => {
        try {
            if (isEditing && form.id) {
                // UPDATE
                await updateTimeslot(form.id, form);
                alert("Timeslot updated");
            } else {
                // CREATE (🔥 REMOVE ID)
                const newData = { ...form };
                delete newData.id;

                await addTimeslot(newData);
                alert("Timeslot added");
            }

            resetForm();
            loadTimeslots();
        } catch (err) {
            console.error("Error saving timeslot:", err);
        }
    };

    // ======================
    // EDIT
    // ======================
    const handleEdit = (t) => {
        setForm({
            id: t.id,
            day: t.day,
            slotNumber: t.slotNumber,
            startTime: t.startTime,
            endTime: t.endTime,
            type: t.type
        });
        setIsEditing(true);
    };

    // ======================
    // DELETE
    // ======================
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this timeslot?")) return;

        try {
            await deleteTimeslot(id);
            loadTimeslots();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // ======================
    // RESET (🔥 IMPORTANT)
    // ======================
    const resetForm = () => {
        setForm({
            id: "",
            day: "",
            slotNumber: "",
            startTime: "",
            endTime: "",
            type: "LECTURE"
        });
        setIsEditing(false);
    };

    // ======================
    // FILTER
    // ======================
    const filtered = timeslots.filter((t) =>
        t.day.toLowerCase().includes(search.toLowerCase()) ||
        t.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Timeslots</h1>

            {/* FORM */}
            <div className="bg-white p-6 rounded-2xl shadow mb-6">

                {isEditing && (
                    <input
                        value={form.id}
                        readOnly
                        className="w-full p-2 mb-2 border rounded bg-gray-100"
                    />
                )}

                <input
                    name="day"
                    placeholder="Day (MONDAY)"
                    value={form.day}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                />

                <input
                    name="slotNumber"
                    type="number"
                    placeholder="Slot Number"
                    value={form.slotNumber}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                />

                <input
                    name="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                />

                <input
                    name="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                />

                <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full p-2 mb-2 border rounded"
                >
                    <option value="LECTURE">LECTURE</option>
                    <option value="LAB">LAB</option>
                    <option value="BREAK">BREAK</option>
                </select>

                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {isEditing ? "Update Timeslot" : "Add Timeslot"}
                </button>

                {isEditing && (
                    <button
                        onClick={resetForm}
                        className="ml-3 bg-gray-400 text-white px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <input
                placeholder="Search by day or type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 mb-4 border rounded"
            />

            {/* TABLE */}
            <div className="bg-white p-6 rounded-2xl shadow">
                <table className="w-full">
                    <thead>
                    <tr className="border-b text-left">
                        <th className="p-2">Day</th>
                        <th className="p-2">Slot</th>
                        <th className="p-2">Start</th>
                        <th className="p-2">End</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {filtered.length > 0 ? (
                        filtered.map((t) => (
                            <tr key={t.id} className="border-b hover:bg-gray-100">
                                <td className="p-2">{t.day}</td>
                                <td className="p-2">{t.slotNumber}</td>
                                <td className="p-2">{t.startTime}</td>
                                <td className="p-2">{t.endTime}</td>
                                <td className="p-2">{t.type}</td>
                                <td className="p-2">
                                    <button
                                        onClick={() => handleEdit(t)}
                                        className="bg-yellow-400 px-3 py-1 rounded mr-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center p-4">
                                No timeslots found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Timeslots;