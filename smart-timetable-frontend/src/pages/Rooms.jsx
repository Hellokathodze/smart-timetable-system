import { useEffect, useState } from "react";
import {
    fetchRooms,
    addRoom,
    updateRoom,
    deleteRoom
} from "../services/api";

const Rooms = () => {

    const [rooms, setRooms] = useState([]);
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        id: "",
        roomNumber: "",
        building: "",
        capacity: "",
        type: "CLASSROOM"
    });

    // LOAD DATA
    const loadRooms = async () => {
        try {
            const data = await fetchRooms();
            setRooms(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadRooms();
    }, []);

    // HANDLE INPUT
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    // ADD / UPDATE
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (form.id) {
                await updateRoom(form.id, form);
                alert("Room updated");
            } else {
                const { id, ...newRoom } = form;
                await addRoom(newRoom);
                alert("Room added");
            }

            resetForm();
            loadRooms();

        } catch (err) {
            console.error(err);
        }
    };

    // DELETE
    const handleDelete = async (id) => {

        if (!id) {
            alert("Invalid Room ID");
            return;
        }

        if (!window.confirm("Delete this room?")) return;

        try {
            await deleteRoom(id);
            alert("Room deleted");
            loadRooms();
        } catch (err) {
            console.error(err);
        }
    };

    // EDIT
    const handleEdit = (room) => {
        setForm({
            id: room.id || room._id,
            roomNumber: room.roomNumber,
            building: room.building,
            capacity: room.capacity,
            type: room.type
        });
    };

    // RESET
    const resetForm = () => {
        setForm({
            id: "",
            roomNumber: "",
            building: "",
            capacity: "",
            type: "CLASSROOM"
        });
    };

    // FILTER
    const filteredRooms = rooms.filter(r =>
        r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase()) ||
        (r.building || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>

            <h1 className="text-2xl font-bold mb-6">Rooms</h1>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow mb-6">

                {form.id && (
                    <input
                        type="text"
                        value={form.id}
                        readOnly
                        className="w-full mb-2 p-2 border bg-gray-100"
                    />
                )}

                <input
                    name="roomNumber"
                    placeholder="Room Number"
                    value={form.roomNumber}
                    onChange={handleChange}
                    className="w-full mb-2 p-2 border"
                    required
                />

                <input
                    name="building"
                    placeholder="Building"
                    value={form.building}
                    onChange={handleChange}
                    className="w-full mb-2 p-2 border"
                />

                <input
                    name="capacity"
                    type="number"
                    placeholder="Capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    className="w-full mb-2 p-2 border"
                    required
                />

                <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full mb-2 p-2 border"
                >
                    <option value="CLASSROOM">CLASSROOM</option>
                    <option value="LAB">LAB</option>
                </select>

                <div className="flex gap-2">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded">
                        {form.id ? "Update Room" : "Add Room"}
                    </button>

                    {form.id && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

            </form>

            {/* SEARCH */}
            <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 p-2 border w-full"
            />

            {/* TABLE */}
            <div className="bg-white p-6 rounded-2xl shadow">
                <table className="w-full">

                    <thead>
                    <tr className="border-b text-left">
                        <th className="p-2">Room</th>
                        <th className="p-2">Capacity</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Building</th>
                        <th className="p-2">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {filteredRooms.map((room) => {

                        const roomId = room.id || room._id;

                        return (
                            <tr key={roomId} className="border-b hover:bg-gray-100">

                                <td className="p-2">{room.roomNumber}</td>
                                <td className="p-2">{room.capacity}</td>
                                <td className="p-2">{room.type}</td>
                                <td className="p-2">{room.building}</td>

                                <td className="p-2 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(room)}
                                        className="bg-yellow-400 px-2 py-1 rounded"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(roomId)}
                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </td>

                            </tr>
                        );
                    })}
                    </tbody>

                </table>
            </div>

        </div>
    );
};

export default Rooms;