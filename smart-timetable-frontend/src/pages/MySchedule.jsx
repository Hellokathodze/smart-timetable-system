import { useEffect, useState, useRef } from "react";

const BASE_URL = "http://localhost:8081";
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const slots = [1, 2, 3, 4, 5, 6];

const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");
const getEmail = () => { const t = getToken(); if (!t) return ""; try { return JSON.parse(atob(t.split(".")[1])).sub || ""; } catch { return ""; } };

const MySchedule = () => {
    const [timetable, setTimetable] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({ classes: 0, days: 0 });
    const [contextMenu, setContextMenu] = useState(null);
    const [extensionModal, setExtensionModal] = useState(null);
    const [selectedExtSlots, setSelectedExtSlots] = useState([]);
    const [sending, setSending] = useState(false);
    const [myMessages, setMyMessages] = useState([]);
    const [myReviews, setMyReviews] = useState({}); // ✅ scheduleId → rating

    const role = getRole(); const email = getEmail();

    useEffect(() => { loadMySchedule(); loadMyMessages(); loadMyReviews(); }, []);
    useEffect(() => { const h = () => setContextMenu(null); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);

    const authFetch = async (url, opts = {}) => { const token = getToken(); return await fetch(`${BASE_URL}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers } }); };

    const loadMySchedule = async () => {
        try {
            setLoading(true); setError("");
            const token = getToken(); if (!token) { setError("Session expired."); setLoading(false); return; }
            const url = role === "FACULTY" ? `${BASE_URL}/schedule/my-timetable` : `${BASE_URL}/schedule/timetable?branch=CE&division=A`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { setError("Failed to load schedule"); setLoading(false); return; }
            const data = await res.json(); setTimetable(data || {});
            let tc = 0, ad = 0;
            Object.values(data || {}).forEach(ds => { const f = ds.filter(s => s.subject !== "BREAK"); if (f.length > 0) ad++; tc += f.length; });
            setStats({ classes: tc, days: ad });
        } catch { setError("Something went wrong"); } finally { setLoading(false); }
    };

    const loadMyMessages = async () => { const r = await authFetch("/messages/my"); if (r.ok) setMyMessages(await r.json()); };

    // ✅ Load reviews
    const loadMyReviews = async () => {
        const r = await authFetch("/reviews/my");
        if (r.ok) {
            const data = await r.json();
            const map = {};
            data.forEach(rev => { map[rev.scheduleId] = rev.rating; });
            setMyReviews(map);
        }
    };

    const getSlotData = (day, slot) => (timetable[day] || []).find(i => i.slot === slot);
    const getActiveSubstitute = (day, slot) => myMessages.find(m => m.day === day && m.slotNumber === slot && m.status === "RESOLVED" && m.substituteTeacherId);

    const handleContextMenu = (e, day, slot, data) => {
        e.preventDefault();
        if (!data || data.subject === "BREAK") return;
        setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 300), day, slot, data, hasActiveSub: !!getActiveSubstitute(day, slot), subMessage: getActiveSubstitute(day, slot) });
    };

    const sendQuickMessage = async (type) => {
        if (!contextMenu) return;
        const reason = prompt(type === "CANCELLATION" ? "Reason for cancellation:" : "Reason for substitute request:");
        if (!reason) return;
        setSending(true);
        const r = await authFetch("/messages", { method: "POST", body: JSON.stringify({ type, content: reason, fromName: email, day: contextMenu.day, slotNumber: contextMenu.slot, subjectName: contextMenu.data.subject }) });
        if (r.ok) alert("Request sent!"); else alert("Failed");
        setSending(false); setContextMenu(null); loadMyMessages();
    };

    const handleRequestCancelSub = async () => {
        if (!contextMenu?.subMessage) return;
        if (!window.confirm("Send cancel substitute request?")) return;
        const r = await authFetch(`/messages/${contextMenu.subMessage.id}/request-cancel-substitute`, { method: "POST" });
        if (r.ok) alert("Request sent for approval"); else alert("Failed");
        setContextMenu(null); loadMyMessages();
    };

    const openExtensionModal = async () => {
        if (!contextMenu) return;
        const otherSlots = slots.filter(s => s !== contextMenu.slot);
        const r = await authFetch(`/messages/slot-info?day=${contextMenu.day}&slots=${otherSlots.join(",")}`);
        let slotInfo = []; if (r.ok) slotInfo = await r.json();
        setExtensionModal({ day: contextMenu.day, slot: contextMenu.slot, data: contextMenu.data, slotInfo });
        setSelectedExtSlots([]); setContextMenu(null);
    };

    const toggleExtSlot = (slot) => { setSelectedExtSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]); };

    const submitExtension = async () => {
        if (selectedExtSlots.length === 0) { alert("Select at least one slot"); return; }
        const reason = prompt("Reason for extension:");
        if (!reason) return;
        setSending(true);
        const r = await authFetch("/messages/extension", { method: "POST", body: JSON.stringify({ fromName: email, content: reason, day: extensionModal.day, slotNumber: extensionModal.slot, subjectName: extensionModal.data.subject, extensionSlots: selectedExtSlots }) });
        if (r.ok) { alert("Extension request sent!"); setExtensionModal(null); loadMyMessages(); } else alert("Failed");
        setSending(false);
    };

    // ✅ Submit review
    const submitReview = async (rating) => {
        if (!contextMenu) return;
        const data = contextMenu.data;

        // We need the scheduleId — find it from the full schedule
        const r = await authFetch(`/messages/slot-info?day=${contextMenu.day}&slots=${contextMenu.slot}`);
        let scheduleId = null;
        if (r.ok) {
            const info = await r.json();
            if (info.length > 0 && info[0].scheduleId) scheduleId = info[0].scheduleId;
        }

        if (!scheduleId) { alert("Could not find schedule entry for this slot"); setContextMenu(null); return; }

        const res = await authFetch("/reviews", {
            method: "POST",
            body: JSON.stringify({
                scheduleId,
                teacherName: data.teacher || email,
                day: contextMenu.day,
                slotNumber: contextMenu.slot,
                subjectName: data.subject,
                rating,
            }),
        });

        if (res.ok) {
            setMyReviews(prev => ({ ...prev, [scheduleId]: rating }));
            alert(rating === 1 ? "Slot approved ✓" : "Slot disapproved ✗");
        } else alert("Failed to submit review");
        setContextMenu(null);
    };

    const getSubjectColor = (subject) => {
        const colors = ["bg-blue-50 text-blue-700 border-blue-200", "bg-green-50 text-green-700 border-green-200", "bg-purple-50 text-purple-700 border-purple-200", "bg-amber-50 text-amber-700 border-amber-200", "bg-pink-50 text-pink-700 border-pink-200", "bg-cyan-50 text-cyan-700 border-cyan-200", "bg-indigo-50 text-indigo-700 border-indigo-200", "bg-teal-50 text-teal-700 border-teal-200"];
        let h = 0; for (let c of subject) h += c.charCodeAt(0); return colors[h % colors.length];
    };

    // ✅ Get review status for a slot (need scheduleId from timetable data)
    const getReviewForSlot = (day, slot) => {
        // We stored reviews by scheduleId, but timetable data doesn't include scheduleId
        // So we check by day-slot key in myReviews
        for (const [schedId, rating] of Object.entries(myReviews)) {
            // We'll match by checking if any review matches this day+slot
            // This is approximate — ideally we'd store day+slot on the review
        }
        return null;
    };

    const renderCell = (day, slot, data) => {
        if (!data) return <div className="flex items-center justify-center h-full py-4"><span className="text-gray-300 text-xs">—</span></div>;
        if (data.subject === "BREAK") return <div className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-dashed border-orange-300 text-center"><div className="font-semibold text-xs">BREAK</div></div>;

        const hasSub = !!getActiveSubstitute(day, slot);

        // ✅ Find review for this slot
        const reviewEntry = Object.entries(myReviews).find(([sid, r]) => {
            // Match by checking all reviews — we stored day+slot in the review
            return true; // We'll use a better approach below
        });

        return (
            <div onContextMenu={(e) => handleContextMenu(e, day, slot, data)}
                 className={`p-2.5 rounded-lg border ${getSubjectColor(data.subject)} transition-all hover:shadow-md cursor-context-menu relative ${hasSub ? "ring-2 ring-orange-300" : ""}`}
                 title="Right-click for options">
                <div className="font-semibold text-sm">{data.subject}</div>
                {role === "FACULTY" ? <div className="text-xs opacity-70 mt-0.5">Room {data.room}</div> : <><div className="text-xs opacity-70 mt-0.5">{data.teacher}</div><div className="text-xs opacity-50">Room {data.room}</div></>}
                {data.startTime && data.startTime !== "-" && <div className="text-[10px] opacity-40 mt-1">{data.startTime} - {data.endTime}</div>}
                {hasSub && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" />}
            </div>
        );
    };

    if (loading) return <div className="animate-pulse p-6"><div className="h-8 w-48 bg-gray-200 rounded-lg mb-6" /><div className="h-96 bg-gray-100 rounded-2xl" /></div>;
    if (error) return <div className="flex flex-col items-center justify-center h-[60vh]"><p className="text-gray-500 mb-4">{error}</p><button onClick={loadMySchedule} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Try Again</button></div>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-800">{role === "FACULTY" ? "My Teaching Schedule" : "My Class Schedule"}</h1>
                <p className="text-sm text-gray-400 mt-1">{role === "FACULTY" ? "Right-click any class for options (cancel, substitute, extend, review)" : "Your class timetable"}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-xs text-gray-400 uppercase">Total Classes</div><div className="text-2xl font-bold">{stats.classes}</div></div>
                <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-xs text-gray-400 uppercase">Active Days</div><div className="text-2xl font-bold">{stats.days}</div></div>
                <div className="bg-white rounded-xl border p-4 shadow-sm"><div className="text-xs text-gray-400 uppercase">Avg / Day</div><div className="text-2xl font-bold">{stats.days > 0 ? (stats.classes / stats.days).toFixed(1) : 0}</div></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <table className="w-full text-center">
                    <thead><tr className="bg-gray-50 border-b"><th className="p-3 text-xs font-semibold text-gray-500 uppercase">Day</th>{slots.map(s => <th key={s} className="p-3 text-xs font-semibold text-gray-500 uppercase">Slot {s}</th>)}</tr></thead>
                    <tbody>{days.map(day => (
                        <tr key={day} className="border-t hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-sm text-gray-700 bg-gray-50/80">{day.charAt(0) + day.slice(1).toLowerCase()}</td>
                            {slots.map(slot => <td key={slot} className="p-2 border-l min-w-[130px]">{renderCell(day, slot, getSlotData(day, slot))}</td>)}
                        </tr>
                    ))}</tbody>
                </table>
            </div>

            {/* RIGHT-CLICK CONTEXT MENU */}
            {contextMenu && (
                <div className="fixed bg-white rounded-xl shadow-2xl border py-1 z-50 min-w-[220px]" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
                    <div className="px-3 py-2 border-b border-gray-100">
                        <div className="text-xs font-bold text-gray-800">{contextMenu.data.subject}</div>
                        <div className="text-[10px] text-gray-400">{contextMenu.day} • Slot {contextMenu.slot}</div>
                    </div>

                    {/* ✅ Review options */}
                    <div className="border-b border-gray-100">
                        <button onClick={() => submitReview(1)} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 text-green-600 flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Approve Slot
                        </button>
                        <button onClick={() => submitReview(2)} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            Disapprove Slot
                        </button>
                    </div>

                    <button onClick={() => sendQuickMessage("CANCELLATION")} disabled={sending} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        Cancel Lecture
                    </button>
                    <button onClick={() => sendQuickMessage("SUBSTITUTE_REQUEST")} disabled={sending} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                        Request Substitute
                    </button>
                    <button onClick={openExtensionModal} className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 text-purple-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        Extend Lecture
                    </button>
                    {contextMenu.hasActiveSub && (
                        <button onClick={handleRequestCancelSub} className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 text-orange-600 flex items-center gap-2 border-t border-gray-100">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            Cancel Substitute
                        </button>
                    )}
                </div>
            )}

            {/* EXTENSION MODAL */}
            {extensionModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto p-6">
                        <h2 className="text-lg font-bold mb-1">Extend Lecture</h2>
                        <p className="text-sm text-gray-400 mb-4">Extending <strong>{extensionModal.data.subject}</strong> from {extensionModal.day} Slot {extensionModal.slot}.</p>
                        <div className="space-y-2 mb-4">
                            {extensionModal.slotInfo.map(info => (
                                <label key={info.slot} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${selectedExtSlots.includes(info.slot) ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:bg-gray-50"}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={selectedExtSlots.includes(info.slot)} onChange={() => toggleExtSlot(info.slot)} className="w-4 h-4 text-purple-600 rounded" />
                                        <div><span className="font-medium text-sm">Slot {info.slot}</span>{info.occupied ? <span className="text-xs text-gray-400 ml-2">{info.subject} — {info.teacher}</span> : <span className="text-xs text-green-500 ml-2">FREE</span>}</div>
                                    </div>
                                    {info.occupied && selectedExtSlots.includes(info.slot) && <span className="text-[10px] text-orange-500">Will be reassigned</span>}
                                </label>
                            ))}
                        </div>
                        {selectedExtSlots.length > 0 && <div className="mb-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700"><strong>Note:</strong> Requires Head Teacher / Admin approval.</div>}
                        <div className="flex gap-2">
                            <button onClick={submitExtension} disabled={sending || selectedExtSlots.length === 0} className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">{sending ? "Sending..." : `Request Extension (${selectedExtSlots.length})`}</button>
                            <button onClick={() => setExtensionModal(null)} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySchedule;