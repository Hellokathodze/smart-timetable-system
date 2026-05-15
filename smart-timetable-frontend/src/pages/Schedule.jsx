import { useEffect, useState, useRef } from "react";
import { fetchTimetable, generateTimetable } from "../services/api";

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const slots = [1, 2, 3, 4, 5, 6];

const BASE_URL = "http://localhost:8081";
const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");
const getEmail = () => { const t = getToken(); if (!t) return ""; try { return JSON.parse(atob(t.split(".")[1])).sub || ""; } catch { return ""; } };

const Schedule = () => {
    const [timetable, setTimetable] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [clashes, setClashes] = useState({});
    const [stats, setStats] = useState({ total: 0, free: 0, clashes: 0, utilization: 0, breaks: 0 });
    const [selected, setSelected] = useState(null);
    const [canGenerate, setCanGenerate] = useState(false);
    const [reviews, setReviews] = useState({}); // ✅ scheduleId → { rating, teacherName }
    const [isHeadTeacher, setIsHeadTeacher] = useState(false);

    const tableRef = useRef();
    const role = getRole();

    useEffect(() => {
        if (role === "ADMIN") { setCanGenerate(true); setIsHeadTeacher(true); }
        else if (role === "FACULTY") { checkGeneratePermission(); }
        loadSchedules();
        loadReviews();
    }, []);

    const checkGeneratePermission = async () => {
        try {
            const email = getEmail();
            const res = await fetch(`${BASE_URL}/teachers/can-generate?email=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (res.ok) { const data = await res.json(); setCanGenerate(data.canGenerate === true); setIsHeadTeacher(data.canGenerate === true); }
        } catch {}
    };

    // ✅ Load all reviews (visible to admin/head teacher)
    const loadReviews = async () => {
        try {
            const res = await fetch(`${BASE_URL}/reviews`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (res.ok) {
                const data = await res.json();
                const map = {};
                data.forEach(r => { map[r.scheduleId] = { rating: r.rating, teacherName: r.teacherName, teacherEmail: r.teacherEmail }; });
                setReviews(map);
            }
        } catch {}
    };

    const loadSchedules = async () => {
        try { setError(""); const data = await fetchTimetable(); setTimetable(data || {}); setClashes(detectClashes(data || {})); setStats(calculateStats(data || {}, detectClashes(data || {}))); }
        catch { setError("Failed to load timetable"); }
    };

    const handleGenerate = async () => {
        try { setLoading(true); setError(""); await generateTimetable(); await loadSchedules(); await loadReviews(); }
        catch { setError("Failed to generate"); }
        finally { setLoading(false); }
    };

    const detectClashes = (data) => {
        const m = {};
        Object.keys(data).forEach(day => { const seen = {}; data[day].forEach(item => { if (item.subject === "BREAK") return; const k = `${item.slot}-${item.teacher}`; if (seen[k]) m[`${day}-${item.slot}-${item.teacher}`] = true; else seen[k] = true; }); });
        return m;
    };

    const calculateStats = (data, clashMap) => {
        const totalSlots = days.length * slots.length; let filled = 0, breakCount = 0;
        Object.values(data).forEach(day => day.forEach(item => { if (item.subject === "BREAK") breakCount++; else filled++; }));
        return { total: totalSlots, free: totalSlots - filled - breakCount, clashes: Object.keys(clashMap).length, utilization: ((filled / totalSlots) * 100).toFixed(1), breaks: breakCount };
    };

    const getSlotData = (day, slot) => (timetable[day] || []).find(i => i.slot === slot);

    const getSubjectColor = (subject) => {
        const colors = ["bg-blue-100 text-blue-800 border border-blue-200", "bg-green-100 text-green-800 border border-green-200", "bg-purple-100 text-purple-800 border border-purple-200", "bg-yellow-100 text-yellow-800 border border-yellow-200", "bg-pink-100 text-pink-800 border border-pink-200", "bg-cyan-100 text-cyan-800 border border-cyan-200", "bg-indigo-100 text-indigo-800 border border-indigo-200", "bg-teal-100 text-teal-800 border border-teal-200"];
        let hash = 0; for (let c of subject) hash += c.charCodeAt(0); return colors[hash % colors.length];
    };

    const formatTime = (s, e) => (!s || s === "-" || !e || e === "-") ? null : `${s} - ${e}`;

    // ✅ Find review for a schedule entry by matching day+slot+teacher
    const getReviewForEntry = (data) => {
        if (!data || !isHeadTeacher) return null;
        // Search through reviews to find one matching this entry
        for (const [schedId, rev] of Object.entries(reviews)) {
            if (rev.teacherName === data.teacher || rev.teacherEmail === data.teacher) {
                // Check if this review's scheduleId matches — we need a better match
                // For now, return all reviews and let the rendering handle it
            }
        }
        return null;
    };

    const renderCell = (day, slot, data) => {
        if (!data) return <div className="flex items-center justify-center h-full"><span className="text-gray-300 text-sm font-medium">FREE</span></div>;

        if (data.subject === "BREAK") {
            return (
                <div className="p-2 rounded-lg bg-orange-50 text-orange-700 border-2 border-orange-300 border-dashed">
                    <div className="font-bold text-sm flex items-center justify-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
                        BREAK
                    </div>
                    {formatTime(data.startTime, data.endTime) && <div className="text-xs mt-0.5 text-orange-400 text-center">{formatTime(data.startTime, data.endTime)}</div>}
                </div>
            );
        }

        const timeStr = formatTime(data.startTime, data.endTime);
        const style = getSubjectColor(data.subject);

        // ✅ Find review for this cell (admin/head teacher only)
        let reviewIndicator = null;
        if (isHeadTeacher && data.scheduleId && reviews[data.scheduleId]) {
            const rev = reviews[data.scheduleId];
            if (rev.rating === 1) {
                reviewIndicator = (
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow" title={`Approved by ${rev.teacherName || 'teacher'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                );
            } else if (rev.rating === 2) {
                reviewIndicator = (
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow" title={`Disapproved by ${rev.teacherName || 'teacher'}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                );
            }
        }

        return (
            <div onClick={() => setSelected(data)} className={`p-2 rounded-lg shadow-sm ${style} transform transition duration-200 hover:scale-105 hover:shadow-lg cursor-pointer relative`}>
                {reviewIndicator}
                <div className="font-semibold text-sm">{data.subject}</div>
                <div className="text-xs opacity-80">{data.teacher}</div>
                <div className="text-xs opacity-60">Room {data.room}</div>
                {timeStr && <div className="text-[10px] mt-1 opacity-50 font-medium"><span className="inline-flex items-center gap-0.5"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{timeStr}</span></div>}
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">📅 Timetable Schedule</h1>
                <div className="flex gap-3">
                    {canGenerate && <button onClick={handleGenerate} className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition">{loading ? "Generating..." : "Generate"}</button>}
                    <button onClick={async () => { const { default: jsPDF } = await import("jspdf"); const { default: html2canvas } = await import("html2canvas"); const canvas = await html2canvas(tableRef.current, { scale: 2 }); const pdf = new jsPDF("landscape", "mm", "a4"); pdf.text("Timetable", 10, 10); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 20, pdf.internal.pageSize.getWidth() - 20, 0); pdf.save("timetable.pdf"); }} className="bg-green-600 text-white px-5 py-2 rounded-lg shadow hover:bg-green-700 transition">Download PDF</button>
                </div>
            </div>

            {loading && <div className="text-center mb-4 text-blue-600 font-semibold animate-pulse">🤖 AI is generating...</div>}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            {/* ✅ Review legend for admin/head teacher */}
            {isHeadTeacher && Object.keys(reviews).length > 0 && (
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Teacher Approved</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span> Teacher Disapproved</span>
                    <span className="text-gray-400">({Object.keys(reviews).length} reviews total)</span>
                </div>
            )}

            <div className="grid grid-cols-5 gap-4 mb-6">
                {[{ label: "Total Slots", value: stats.total }, { label: "Free Slots", value: stats.free }, { label: "Clashes", value: stats.clashes }, { label: "Breaks", value: stats.breaks }, { label: "Utilization", value: stats.utilization + "%" }].map((s, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow border hover:shadow-lg transition"><div className="text-gray-500 text-sm">{s.label}</div><div className="text-2xl font-bold">{s.value}</div></div>
                ))}
            </div>

            <div ref={tableRef} className="bg-white p-6 rounded-xl shadow">
                <table className="w-full border text-center">
                    <thead><tr className="bg-gray-50"><th className="p-3 font-semibold text-gray-600">Day / Slot</th>{slots.map(s => <th key={s} className="p-3 font-semibold text-gray-600">Slot {s}</th>)}</tr></thead>
                    <tbody>{days.map(day => (
                        <tr key={day} className="border-t">
                            <td className="font-bold p-3 text-gray-700 bg-gray-50">{day}</td>
                            {slots.map(slot => {
                                const data = getSlotData(day, slot);
                                return <td key={slot} className="p-2 border-l min-w-[140px]">{renderCell(day, slot, data)}</td>;
                            })}
                        </tr>
                    ))}</tbody>
                </table>
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-xl w-[420px] shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{selected.subject}</h2>
                        <div className="space-y-2 text-sm">
                            <div><b>Teacher:</b> {selected.teacher}</div>
                            <div><b>Room:</b> {selected.room}</div>
                            <div><b>Time:</b> {selected.startTime || "-"} - {selected.endTime || "-"}</div>
                        </div>
                        <button onClick={() => setSelected(null)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg w-full hover:bg-red-600">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;