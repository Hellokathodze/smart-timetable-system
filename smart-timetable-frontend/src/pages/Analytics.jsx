import { useEffect, useState, useMemo, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
    PieChart,
    Pie,
    Sector,
} from "recharts";

/* ───────────── inline SVG icons ───────────── */
const IconChart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="7" width="4" height="14" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
);

const IconTeacher = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <rect x="7" y="14" width="3" height="3" rx="0.5" />
    </svg>
);

const IconAverage = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

const BASE_URL = "http://localhost:8081";

const getToken = () => localStorage.getItem("token");

/* ───────────── color palettes ───────────── */
const TEACHER_COLORS = [
    "#6366f1", "#8b5cf6", "#a78bfa", "#7c3aed",
    "#4f46e5", "#818cf8", "#6d28d9", "#c084fc",
    "#4338ca", "#7e22ce", "#a855f7", "#5b21b6",
];

const DAY_COLORS = [
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
];

const PIE_COLORS = [
    "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
    "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
    "#f97316", "#84cc16", "#e879f9", "#38bdf8",
];

/* ───────────── custom bar tooltip ───────────── */
const CustomTooltip = ({ active, payload, label, unit }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700/50 backdrop-blur-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className="text-lg font-bold">
                {payload[0].value}{" "}
                <span className="text-sm font-normal text-gray-300">
                    {unit || "classes"}
                </span>
            </p>
        </div>
    );
};

/* ───────────── pie active shape (hover effect) ───────────── */
const renderActiveShape = (props) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, value, percent,
    } = props;

    return (
        <g>
            {/* center label — teacher name */}
            <text x={cx} y={cy - 12} textAnchor="middle" fill="#1f2937" fontSize="13" fontWeight="600">
                {payload.name.length > 18 ? payload.name.slice(0, 17) + "…" : payload.name}
            </text>
            {/* center label — value */}
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#6366f1" fontSize="24" fontWeight="800">
                {value}
            </text>
            {/* center label — percent */}
            <text x={cx} y={cy + 32} textAnchor="middle" fill="#9ca3af" fontSize="11">
                {`${(percent * 100).toFixed(0)}% of total`}
            </text>

            {/* outer glow sector */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius - 5}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.2}
            />
            {/* main expanded sector */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        </g>
    );
};

/* ───────────── stat card ───────────── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div
        className="relative overflow-hidden rounded-2xl p-5 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        style={{
            background: `linear-gradient(135deg, ${color}08, ${color}15)`,
            borderColor: `${color}30`,
        }}
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    {label}
                </p>
                <p className="text-3xl font-extrabold text-gray-800">{value}</p>
                {sub && (
                    <p className="text-xs text-gray-500 mt-1">{sub}</p>
                )}
            </div>
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
                <Icon />
            </div>
        </div>
        <div
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10"
            style={{ background: color }}
        />
    </div>
);

/* ───────────── custom x-axis tick (truncate long names) ───────────── */
const CustomXAxisTick = ({ x, y, payload }) => {
    const name = payload.value;
    const short = name.length > 14 ? name.slice(0, 13) + "…" : name;
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={14}
                textAnchor="middle"
                className="fill-gray-500"
                style={{ fontSize: "11px", fontWeight: 500 }}
            >
                {short}
            </text>
        </g>
    );
};

/* ═══════════════ MAIN COMPONENT ═══════════════ */
const Analytics = () => {
    const [teacherData, setTeacherData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePieIndex, setActivePieIndex] = useState(0);

    const onPieEnter = useCallback((_, index) => {
        setActivePieIndex(index);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = getToken();

            if (!token) {
                setError("Session expired. Please login again.");
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            const [teacherRes, dailyRes] = await Promise.all([
                fetch(`${BASE_URL}/schedule/stats/teacher-load`, { headers }),
                fetch(`${BASE_URL}/schedule/stats/daily`, { headers }),
            ]);

            if (!teacherRes.ok || !dailyRes.ok) {
                setError("Failed to load analytics data.");
                setLoading(false);
                return;
            }

            const teacherJson = await teacherRes.json();
            const dailyJson = await dailyRes.json();

            setTeacherData(
                Object.entries(teacherJson).map(([name, value]) => ({ name, value }))
            );
            setDailyData(
                Object.entries(dailyJson).map(([name, value]) => ({ name, value }))
            );
        } catch (err) {
            console.error("Analytics Error:", err);
            setError("Something went wrong while fetching data.");
        } finally {
            setLoading(false);
        }
    };

    /* ───── derived stats ───── */
    const stats = useMemo(() => {
        const totalClasses = dailyData.reduce((sum, d) => sum + d.value, 0);
        const busiestDay =
            dailyData.length > 0
                ? dailyData.reduce((a, b) => (a.value >= b.value ? a : b))
                : null;
        const topTeacher =
            teacherData.length > 0
                ? teacherData.reduce((a, b) => (a.value >= b.value ? a : b))
                : null;
        const avgLoad =
            teacherData.length > 0
                ? (teacherData.reduce((sum, t) => sum + t.value, 0) / teacherData.length).toFixed(1)
                : 0;

        return { totalClasses, busiestDay, topTeacher, avgLoad };
    }, [teacherData, dailyData]);

    /* ───── loading skeleton ───── */
    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 w-64 bg-gray-200 rounded-lg mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-80 bg-gray-100 rounded-2xl border border-gray-200" />
                    ))}
                </div>
            </div>
        );
    }

    /* ───── error state ───── */
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Oops! Something went wrong
                </h2>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <button
                    onClick={fetchData}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* ─── HEADER ─── */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                    Analytics Dashboard
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Overview of teacher workloads and weekly class distribution
                </p>
            </div>

            {/* ─── STAT CARDS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    icon={IconChart}
                    label="Total Classes"
                    value={stats.totalClasses}
                    sub="Across the week"
                    color="#6366f1"
                />
                <StatCard
                    icon={IconTeacher}
                    label="Top Teacher"
                    value={stats.topTeacher?.value || 0}
                    sub={stats.topTeacher?.name || "—"}
                    color="#06b6d4"
                />
                <StatCard
                    icon={IconCalendar}
                    label="Busiest Day"
                    value={stats.busiestDay?.value || 0}
                    sub={stats.busiestDay?.name || "—"}
                    color="#10b981"
                />
                <StatCard
                    icon={IconAverage}
                    label="Avg Load / Teacher"
                    value={stats.avgLoad}
                    sub={`${teacherData.length} teachers total`}
                    color="#f59e0b"
                />
            </div>

            {/* ─── CHARTS ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* TEACHER LOAD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-gray-800">
                                Teacher Load
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Number of classes per teacher
                            </p>
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full">
                            {teacherData.length} Teachers
                        </span>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={teacherData}
                            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 6"
                                vertical={false}
                                stroke="#f1f5f9"
                            />
                            <XAxis
                                dataKey="name"
                                tick={<CustomXAxisTick />}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                            />
                            <Tooltip
                                content={<CustomTooltip unit="classes" />}
                                cursor={{ fill: "#f1f5f9", radius: 8 }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={48}
                                animationDuration={800}
                                animationBegin={100}
                            >
                                {teacherData.map((_, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={TEACHER_COLORS[idx % TEACHER_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* DAILY DISTRIBUTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-base font-bold text-gray-800">
                                Daily Distribution
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Classes scheduled per day
                            </p>
                        </div>
                        <span className="text-xs bg-cyan-50 text-cyan-600 font-semibold px-3 py-1 rounded-full">
                            {dailyData.length} Days
                        </span>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={dailyData}
                            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 6"
                                vertical={false}
                                stroke="#f1f5f9"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#94a3b8" }}
                            />
                            <Tooltip
                                content={<CustomTooltip unit="classes" />}
                                cursor={{ fill: "#f0fdfa", radius: 8 }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={56}
                                animationDuration={800}
                                animationBegin={250}
                            >
                                {dailyData.map((_, idx) => (
                                    <Cell
                                        key={idx}
                                        fill={DAY_COLORS[idx % DAY_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── PIE + BREAKDOWN ROW ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* PIE CHART — 2 of 5 cols */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="mb-2">
                        <h2 className="text-base font-bold text-gray-800 mb-1">
                            Workload Share
                        </h2>
                        <p className="text-xs text-gray-400">
                            Hover to see per teacher
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-center min-h-[360px]">
                        <ResponsiveContainer width="100%" height={360}>
                            <PieChart>
                                <Pie
                                    activeIndex={activePieIndex}
                                    activeShape={renderActiveShape}
                                    data={teacherData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    animationDuration={900}
                                    stroke="none"
                                    onMouseEnter={onPieEnter}
                                    style={{ cursor: "pointer" }}
                                >
                                    {teacherData.map((_, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* interactive legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-4 border-t border-gray-100">
                        {teacherData.map((t, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                                onMouseEnter={() => setActivePieIndex(idx)}
                            >
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                                />
                                <span className="text-[11px] text-gray-500 whitespace-nowrap">
                                    {t.name.length > 16 ? t.name.slice(0, 15) + "…" : t.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TEACHER BREAKDOWN — 3 of 5 cols */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-800 mb-1">
                            Teacher Breakdown
                        </h2>
                        <p className="text-xs text-gray-400">
                            Detailed class allocation per teacher
                        </p>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto pr-1" style={{ maxHeight: "420px" }}>
                        {teacherData
                            .slice()
                            .sort((a, b) => b.value - a.value)
                            .map((teacher, idx) => {
                                const max = Math.max(
                                    ...teacherData.map((t) => t.value),
                                    1
                                );
                                const pct = Math.round((teacher.value / max) * 100);
                                const color = TEACHER_COLORS[idx % TEACHER_COLORS.length];

                                return (
                                    <div
                                        key={idx}
                                        className="group hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ background: color }}
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {teacher.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-800">
                                                {teacher.value}{" "}
                                                <span className="text-xs font-normal text-gray-400">
                                                    {teacher.value === 1 ? "class" : "classes"}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-90"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {teacherData.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-8">
                            No teacher data available
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
