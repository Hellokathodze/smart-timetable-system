import { NavLink } from "react-router-dom";

const getRoleFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).role; } catch { return null; }
};

const getUserEmailFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return "";
    try { return JSON.parse(atob(token.split(".")[1])).sub || ""; } catch { return ""; }
};

const Sidebar = () => {
    const role = getRoleFromToken();
    const email = getUserEmailFromToken();

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`;

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login";
    };

    const roleBadge = { ADMIN: "bg-red-500/20 text-red-400", FACULTY: "bg-blue-500/20 text-blue-400", STUDENT: "bg-green-500/20 text-green-400" };

    return (
        <div className="w-64 h-screen bg-gray-900 text-white flex flex-col">
            <div className="p-5 border-b border-gray-800">
                <h1 className="text-xl font-bold tracking-tight">Dy Patil</h1>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${roleBadge[role] || "bg-gray-700 text-gray-400"}`}>{role || "—"}</span>
                    <span className="text-xs text-gray-500 truncate">{email}</span>
                </div>
            </div>

            <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
                <NavLink to="/" end className={linkClass}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Dashboard
                </NavLink>

                {role === "ADMIN" && (
                    <>
                        <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-4 mb-1 px-3">Management</div>
                        <NavLink to="/teachers" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Teachers
                        </NavLink>
                        <NavLink to="/students" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></svg>
                            Students
                        </NavLink>
                        <NavLink to="/subjects" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            Subjects
                        </NavLink>
                        <NavLink to="/rooms" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                            Rooms
                        </NavLink>
                        <NavLink to="/timeslots" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Timeslots
                        </NavLink>
                        <NavLink to="/analytics" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
                            Analytics
                        </NavLink>
                    </>
                )}

                {/* SCHEDULE */}
                <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-4 mb-1 px-3">Schedule</div>

                {(role === "FACULTY" || role === "STUDENT") && (
                    <NavLink to="/my-schedule" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="7" y="14" width="3" height="3" rx="0.5"/></svg>
                        My Schedule
                    </NavLink>
                )}

                {(role === "ADMIN" || role === "FACULTY") && (
                    <NavLink to="/schedule" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Full Schedule
                    </NavLink>
                )}

                {/* ✅ MESSAGES — FACULTY + ADMIN */}
                {(role === "FACULTY" || role === "ADMIN") && (
                    <>
                        <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-4 mb-1 px-3">Communication</div>
                        <NavLink to="/messages" className={linkClass}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Messages
                        </NavLink>
                    </>
                )}

                {/* ACCOUNT */}
                <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-4 mb-1 px-3">Account</div>
                <NavLink to="/change-password" className={linkClass}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Change Password
                </NavLink>
            </nav>

            <div className="p-3 border-t border-gray-800">
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-600 p-2.5 rounded-lg transition-colors text-sm font-medium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;