import { useEffect, useState } from "react";

const BASE_URL = "http://localhost:8081";
const getToken = () => localStorage.getItem("token");
const getRole = () => localStorage.getItem("role");
const getEmail = () => { const t = getToken(); if (!t) return ""; try { return JSON.parse(atob(t.split(".")[1])).sub || ""; } catch { return ""; } };

const Messages = () => {
    const [inboxMessages, setInboxMessages] = useState([]);  // Head Teacher admin inbox
    const [receivedMessages, setReceivedMessages] = useState([]); // ✅ Messages targeted TO this teacher
    const [allMessages, setAllMessages] = useState([]);
    const [myMessages, setMyMessages] = useState([]);
    const [isHeadTeacher, setIsHeadTeacher] = useState(false);
    const [tab, setTab] = useState("received");
    const [loading, setLoading] = useState(false);
    const [freeTeachers, setFreeTeachers] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [substituteSuccess, setSubstituteSuccess] = useState("");
    const [form, setForm] = useState({ type: "CANCELLATION", content: "", day: "", slotNumber: "", subjectName: "" });

    const role = getRole(); const email = getEmail();

    const authFetch = async (url, opts = {}) => {
        const token = getToken();
        return await fetch(`${BASE_URL}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers } });
    };

    useEffect(() => { checkHeadTeacher(); loadMyMessages(); loadReceived(); }, []);

    const checkHeadTeacher = async () => {
        if (role === "ADMIN") { setIsHeadTeacher(true); setTab("all"); return; }
        try { const r = await authFetch(`/teachers/can-generate?email=${encodeURIComponent(email)}`); if (r.ok) { const d = await r.json(); setIsHeadTeacher(d.canGenerate === true); if (d.canGenerate) setTab("inbox"); } } catch {}
    };

    const loadMyMessages = async () => { const r = await authFetch("/messages/my"); if (r.ok) setMyMessages(await r.json()); };
    const loadReceived = async () => { const r = await authFetch("/messages/received"); if (r.ok) setReceivedMessages(await r.json()); };
    const loadInbox = async () => { const r = await authFetch("/messages/inbox"); if (r.ok) setInboxMessages(await r.json()); };
    const loadAll = async () => { const r = await authFetch("/messages"); if (r.ok) setAllMessages(await r.json()); };

    useEffect(() => { if (isHeadTeacher) { loadInbox(); if (role === "ADMIN") loadAll(); } }, [isHeadTeacher]);

    const handleSend = async (e) => {
        e.preventDefault(); if (!form.content.trim()) return; setLoading(true);
        const r = await authFetch("/messages", { method: "POST", body: JSON.stringify({ ...form, fromName: email, slotNumber: parseInt(form.slotNumber) || 0 }) });
        if (r.ok) { alert("Message sent!"); setForm({ type: "CANCELLATION", content: "", day: "", slotNumber: "", subjectName: "" }); loadMyMessages(); } else alert("Failed"); setLoading(false);
    };

    const handleAcknowledge = async (id) => { await authFetch(`/messages/${id}/acknowledge`, { method: "PUT" }); loadInbox(); loadAll(); loadReceived(); };
    const handleResolve = async (id, resp) => { await authFetch(`/messages/${id}/resolve`, { method: "PUT", body: JSON.stringify({ response: resp || "Resolved" }) }); loadInbox(); loadAll(); loadReceived(); setSelectedMessage(null); setFreeTeachers([]); };
    const handleFindFreeTeachers = async (msg) => { setSelectedMessage(msg); setSubstituteSuccess(""); if (!msg.day || !msg.slotNumber) { setFreeTeachers([]); return; } const r = await authFetch(`/messages/free-teachers?day=${msg.day}&slot=${msg.slotNumber}`); if (r.ok) setFreeTeachers(await r.json()); };

    const handleSubstitute = async (msg, tid, tname) => {
        const r = await authFetch("/messages/substitute", { method: "PUT", body: JSON.stringify({ messageId: msg.id, newTeacherId: tid, scheduleId: msg.scheduleId, day: msg.day, slot: msg.slotNumber }) });
        if (r.ok) { setSubstituteSuccess(`Substituted with ${tname}`); loadInbox(); loadAll(); loadMyMessages(); loadReceived(); setTimeout(() => { setSelectedMessage(null); setFreeTeachers([]); setSubstituteSuccess(""); }, 1500); }
        else { const err = await r.json().catch(() => ({})); alert(err.error || "Failed"); }
    };

    const handleRequestCancelSub = async (id) => { if (!window.confirm("Send cancel substitute request?")) return; const r = await authFetch(`/messages/${id}/request-cancel-substitute`, { method: "POST" }); if (r.ok) alert("Request sent for approval"); else alert("Failed"); loadMyMessages(); };
    const handleApproveCancelSub = async (id) => { const r = await authFetch(`/messages/${id}/approve-cancel-substitute`, { method: "PUT" }); if (r.ok) alert("Approved — original teacher restored"); else alert("Failed"); loadInbox(); loadAll(); };
    const handleApproveExtension = async (id) => { if (!window.confirm("Approve extension? Affected teachers will be notified.")) return; const r = await authFetch(`/messages/${id}/approve-extension`, { method: "PUT" }); if (r.ok) alert("Extension approved"); else alert("Failed"); loadInbox(); loadAll(); };
    const handleCancelExtension = async (id) => { if (!window.confirm("Cancel extension?")) return; const r = await authFetch(`/messages/${id}/cancel-extension`, { method: "PUT" }); if (r.ok) alert("Extension cancelled"); else alert("Failed"); loadMyMessages(); loadInbox(); loadAll(); };
    const handleReject = async (id) => { const reason = prompt("Reason (optional):"); const r = await authFetch(`/messages/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason: reason || "Rejected" }) }); if (r.ok) alert("Rejected"); else alert("Failed"); loadInbox(); loadAll(); loadMyMessages(); };

    const formatTime = (ts) => !ts ? "" : new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

    const statusBadge = (status) => {
        const c = { PENDING: "bg-yellow-100 text-yellow-700", ACKNOWLEDGED: "bg-blue-100 text-blue-700", RESOLVED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-600", APPROVED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700" };
        return `text-xs px-2 py-0.5 rounded-full font-semibold ${c[status] || "bg-gray-100 text-gray-600"}`;
    };

    const formTitles = { CANCELLATION: "Send Cancellation Request", SUBSTITUTE_REQUEST: "Request a Substitute", GENERAL: "Send General Message" };

    const renderCard = (msg, showAdminActions, showTeacherActions) => (
        <div key={msg.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{msg.fromName || msg.fromEmail}</span>
                        <span className={statusBadge(msg.status)}>{msg.status}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{msg.type?.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatTime(msg.createdAt)}</p>
                </div>
                {msg.day && msg.slotNumber > 0 && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium whitespace-nowrap">
                        {msg.day} Slot {msg.slotNumber} {msg.subjectName ? `• ${msg.subjectName}` : ""}
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-700 mb-2">{msg.content}</p>

            {msg.extensionSlots?.length > 0 && <div className="mb-2 p-2 bg-purple-50 rounded text-sm text-purple-700"><span className="font-semibold">Extension into:</span> {msg.extensionSlots.map(s => `Slot ${s}`).join(", ")}{msg.affectedTeacherNames?.length > 0 && <div className="text-xs mt-1">Affected: {msg.affectedTeacherNames.join(", ")}</div>}</div>}
            {msg.response && <div className="mb-2 p-2 bg-green-50 rounded text-sm text-green-700"><span className="font-semibold">Response:</span> {msg.response} {msg.resolvedBy && <span className="text-xs text-green-400 ml-1">by {msg.resolvedBy}</span>}</div>}
            {msg.substituteTeacherName && <div className="mb-2 p-2 bg-indigo-50 rounded text-sm text-indigo-700"><span className="font-semibold">Substitute:</span> {msg.substituteTeacherName} {msg.originalTeacherName && <span className="text-xs text-indigo-400 ml-1">(was: {msg.originalTeacherName})</span>}</div>}

            {/* Admin/Head Teacher actions */}
            {showAdminActions && msg.status === "PENDING" && (
                <div className="flex gap-2 flex-wrap mt-2">
                    {(msg.type === "CANCELLATION" || msg.type === "SUBSTITUTE_REQUEST") && (
                        <>
                            <button onClick={() => handleAcknowledge(msg.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">Acknowledge</button>
                            {msg.day && msg.slotNumber > 0 && <button onClick={() => handleFindFreeTeachers(msg)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Find Substitute</button>}
                            <button onClick={() => handleResolve(msg.id, "Noted")} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Mark Resolved</button>
                        </>
                    )}
                    {msg.type === "CANCEL_SUBSTITUTE" && (<><button onClick={() => handleApproveCancelSub(msg.id)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Approve (Restore)</button><button onClick={() => handleReject(msg.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Reject</button></>)}
                    {msg.type === "EXTENSION" && (<><button onClick={() => handleApproveExtension(msg.id)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Approve Extension</button><button onClick={() => handleReject(msg.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Reject</button></>)}
                    {msg.type === "GENERAL" && <button onClick={() => handleResolve(msg.id, "Noted")} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Mark Resolved</button>}
                </div>
            )}

            {/* Teacher actions on their own messages */}
            {showTeacherActions && msg.status === "RESOLVED" && msg.substituteTeacherId && msg.type !== "CANCEL_SUBSTITUTE" && (
                <button onClick={() => handleRequestCancelSub(msg.id)} className="mt-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200">Request Cancel Substitute</button>
            )}
            {showTeacherActions && msg.status === "APPROVED" && msg.type === "EXTENSION" && msg.fromEmail === email && (
                <button onClick={() => handleCancelExtension(msg.id)} className="mt-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Cancel Extension</button>
            )}

            {/* Received messages: Acknowledge button for affected teachers */}
            {!showAdminActions && !showTeacherActions && msg.status === "PENDING" && (
                <button onClick={() => handleAcknowledge(msg.id)} className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">Acknowledge</button>
            )}

            {/* Free teachers panel */}
            {selectedMessage?.id === msg.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-sm font-bold mb-2">Free Teachers for {msg.day} Slot {msg.slotNumber}</h3>
                    {substituteSuccess && <div className="mb-2 p-2 bg-green-50 text-green-700 rounded text-sm">{substituteSuccess}</div>}
                    {freeTeachers.length === 0 ? <p className="text-sm text-gray-400">No free teachers</p> : (
                        <div className="space-y-2">{freeTeachers.map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                <div><span className="font-medium text-sm">{t.name}</span><span className="text-xs text-gray-400 ml-2">{t.department}</span></div>
                                <button onClick={() => handleSubstitute(msg, t.id, t.name)} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">Assign</button>
                            </div>
                        ))}</div>
                    )}
                    <button onClick={() => { setSelectedMessage(null); setFreeTeachers([]); }} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-800">Messages</h1>
                <p className="text-sm text-gray-400 mt-1">{role === "ADMIN" ? "View all messages and approve actions" : isHeadTeacher ? "Manage requests, approve/reject" : "Send requests and view notifications"}</p>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {role === "ADMIN" && <button onClick={() => { setTab("all"); loadAll(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All Messages ({allMessages.length})</button>}
                {isHeadTeacher && <button onClick={() => { setTab("inbox"); loadInbox(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "inbox" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Admin Inbox ({inboxMessages.filter(m => m.status === "PENDING").length})</button>}

                {/* ✅ ALL teachers get Inbox — shows notifications targeted to them */}
                <button onClick={() => { setTab("received"); loadReceived(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "received" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    Inbox ({receivedMessages.filter(m => m.status === "PENDING").length} new)
                </button>

                <button onClick={() => { setTab("my"); loadMyMessages(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "my" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>My Messages</button>
                {role !== "ADMIN" && <button onClick={() => setTab("send")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "send" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Send Message</button>}
            </div>

            {tab === "send" && (
                <div className="bg-white rounded-2xl shadow-sm border p-6 max-w-lg">
                    <h2 className="text-lg font-bold mb-4">{formTitles[form.type]}</h2>
                    <form onSubmit={handleSend} className="space-y-3">
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2.5 border rounded-lg">
                            <option value="CANCELLATION">Lecture Cancellation</option><option value="SUBSTITUTE_REQUEST">Request Substitute</option><option value="GENERAL">General Message</option>
                        </select>
                        {form.type !== "GENERAL" && (
                            <div className="grid grid-cols-3 gap-2">
                                <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="p-2.5 border rounded-lg"><option value="">Day</option>{["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"].map(d => <option key={d} value={d}>{d}</option>)}</select>
                                <select value={form.slotNumber} onChange={(e) => setForm({ ...form, slotNumber: e.target.value })} className="p-2.5 border rounded-lg"><option value="">Slot</option>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>Slot {s}</option>)}</select>
                                <input placeholder="Subject" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} className="p-2.5 border rounded-lg" />
                            </div>
                        )}
                        <textarea placeholder={form.type === "GENERAL" ? "Your message..." : "Reason..."} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full p-2.5 border rounded-lg h-24 resize-none" required />
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{loading ? "Sending..." : "Send"}</button>
                    </form>
                </div>
            )}

            {/* ✅ Teacher's personal inbox — notifications received */}
            {tab === "received" && (
                <div className="space-y-4">
                    {receivedMessages.length === 0 ? <div className="text-center py-12 text-gray-400">No notifications received</div> :
                        receivedMessages.map(m => renderCard(m, false, false))}
                </div>
            )}

            {/* Head Teacher admin inbox */}
            {tab === "inbox" && isHeadTeacher && <div className="space-y-4">{inboxMessages.length === 0 ? <div className="text-center py-12 text-gray-400">No pending</div> : inboxMessages.map(m => renderCard(m, true, false))}</div>}

            {/* Admin: all messages */}
            {tab === "all" && role === "ADMIN" && <div className="space-y-4">{allMessages.length === 0 ? <div className="text-center py-12 text-gray-400">No messages</div> : allMessages.map(m => renderCard(m, true, false))}</div>}

            {/* My sent messages */}
            {tab === "my" && <div className="space-y-3">{myMessages.length === 0 ? <div className="text-center py-12 text-gray-400">No messages sent yet</div> : myMessages.map(m => renderCard(m, false, true))}</div>}
        </div>
    );
};

export default Messages;