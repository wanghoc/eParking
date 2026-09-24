import { Shield, AlertCircle, Bike, Clock, RefreshCw, Settings as SettingsIcon, FileText, Map, Monitor, Wifi, WifiOff, Wallet, Image as ImageIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiUrl, assetUrl } from "../api";

interface DashboardStats {
    currentParking: number;
    totalVehicles: number;
    monthlyParking: number;
}

interface ActiveSession {
    id: number;
    license_plate: string;
    entry_time: string;
    fee: number;
    payment_status: string;
    balance: number;
    user_id: number;
    entry_image_url?: string | null;
    entry_source?: "ONLINE" | "OFFLINE_SYNC" | "MANUAL";
}

interface EdgeDevice {
    id: number;
    code: string;
    name: string;
    lane: "IN" | "OUT" | "BOTH";
    lot_name: string | null;
    status: "active" | "revoked";
    online: boolean;
    last_seen_at: string | null;
    pending_events: number;
    app_version: string | null;
}

interface DebtAccount {
    user_id: number;
    username: string;
    mssv: string | null;
    phone: string | null;
    plates: string[];
    debt: number;
}

interface ParkingLot {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
}

interface AdminDashboardPageProps {
    onNavigate?: (page: string) => void;
}

const LANE_LABEL: Record<EdgeDevice["lane"], string> = { IN: "Làn vào", OUT: "Làn ra", BOTH: "Vào + Ra" };
const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
    ONLINE: { label: "Trực tuyến", className: "bg-emerald-100 text-emerald-700" },
    OFFLINE_SYNC: { label: "Đồng bộ offline", className: "bg-amber-100 text-amber-700" },
    MANUAL: { label: "Mở thủ công", className: "bg-violet-100 text-violet-700" },
};

const money = (n: number) => `${n.toLocaleString("vi-VN")}₫`;
const shortTime = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

function timeAgo(iso: string | null) {
    if (!iso) return "chưa kết nối";
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s} giây trước`;
    if (s < 3600) return `${Math.round(s / 60)} phút trước`;
    return shortTime(iso);
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
    try {
        const res = await fetch(apiUrl(path));
        return res.ok ? await res.json() : fallback;
    } catch (err) {
        console.error(`Error fetching ${path}:`, err);
        return fallback;
    }
}

function Panel({ title, icon: Icon, right, children }: { title: string; icon: any; right?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-cyan-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                </div>
                {right}
            </div>
            {children}
        </div>
    );
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps = {}) {
    const [stats, setStats] = useState<DashboardStats>({ currentParking: 0, totalVehicles: 0, monthlyParking: 0 });
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [devices, setDevices] = useState<EdgeDevice[]>([]);
    const [debts, setDebts] = useState<DebtAccount[]>([]);
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setIsRefreshing(true);
        const [s, sess, dev, debt, lots] = await Promise.all([
            getJson<Partial<DashboardStats>>("/admin/stats", {}),
            getJson<ActiveSession[]>("/admin/parking-sessions/active", []),
            getJson<EdgeDevice[]>("/admin/edge-devices", []),
            getJson<DebtAccount[]>("/admin/debts", []),
            getJson<ParkingLot[]>("/parking-lots/overview", []),
        ]);
        setStats({
            currentParking: s.currentParking ?? 0,
            totalVehicles: s.totalVehicles ?? 0,
            monthlyParking: s.monthlyParking ?? 0,
        });
        setSessions(sess);
        setDevices(dev);
        setDebts(debt);
        setParkingLots(lots);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const totalDebt = debts.reduce((sum, d) => sum + d.debt, 0);
    const onlineDevices = devices.filter(d => d.online && d.status === "active").length;
    const pendingEvents = devices.reduce((sum, d) => sum + d.pending_events, 0);

    const quickStats = [
        { title: "Xe đang gửi", value: stats.currentParking, icon: Bike, color: "bg-gradient-to-r from-cyan-500 to-cyan-600" },
        { title: "Xe đã đăng ký", value: stats.totalVehicles, icon: Shield, color: "bg-gradient-to-r from-emerald-500 to-emerald-600" },
        { title: "Lượt gửi tháng này", value: stats.monthlyParking, icon: Clock, color: "bg-gradient-to-r from-violet-500 to-violet-600" },
        { title: "Tổng nợ cước", value: money(totalDebt), icon: Wallet, color: totalDebt > 0 ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-gray-400 to-gray-500" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative rounded-2xl p-4 lg:p-8 text-white shadow-2xl overflow-hidden">
                <img src="/img/DLU.jpg" alt="Đại học Đà Lạt" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">Bảng điều khiển</h1>
                        <p className="text-cyan-100 text-base lg:text-lg drop-shadow-md">
                            Nhận diện biển số chạy tại máy trạm cổng · Web quản lý dữ liệu tập trung
                        </p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className="self-start lg:self-auto bg-white bg-opacity-20 p-3 rounded-full hover:bg-opacity-30 transition-all duration-300"
                        title="Làm mới dữ liệu"
                    >
                        <RefreshCw className={`h-5 w-5 drop-shadow-lg ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {quickStats.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                                    <Icon className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-6">
                    {/* Active sessions */}
                    <Panel title="Phiên gửi xe đang mở" icon={Bike} right={<span className="text-sm text-gray-500">{sessions.length} xe</span>}>
                        <div className="overflow-x-auto">
                            {sessions.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Bike className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Không có xe nào đang gửi</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {["Ảnh", "Biển số", "Giờ vào", "Nguồn", "Số dư ví"].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sessions.map(s => {
                                            const img = assetUrl(s.entry_image_url);
                                            const badge = SOURCE_BADGE[s.entry_source || "ONLINE"];
                                            return (
                                                <tr key={s.id} className={`hover:bg-gray-50 ${s.balance < 0 ? "bg-red-50" : ""}`}>
                                                    <td className="px-6 py-3">
                                                        {img ? (
                                                            <button onClick={() => setPreview(img)} title="Xem ảnh">
                                                                <img src={img} alt={s.license_plate} className="h-10 w-16 object-cover rounded border" />
                                                            </button>
                                                        ) : (
                                                            <ImageIcon className="h-5 w-5 text-gray-300" />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{s.license_plate}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{shortTime(s.entry_time)}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
                                                    </td>
                                                    <td className={`px-6 py-3 whitespace-nowrap text-sm font-medium ${s.balance < 0 ? "text-red-600" : "text-gray-900"}`}>
                                                        {money(s.balance)}{s.balance < 0 && " (nợ)"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Panel>

                    {/* Debt accounts */}
                    <Panel title="Tài khoản nợ cước" icon={AlertCircle} right={<span className="text-sm text-red-600 font-semibold">{debts.length} tài khoản · {money(totalDebt)}</span>}>
                        <div className="overflow-x-auto">
                            {debts.length === 0 ? (
                                <p className="p-8 text-center text-gray-500">Không có tài khoản nào đang nợ cước</p>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {["Sinh viên", "MSSV", "Biển số", "Điện thoại", "Đang nợ"].map(h => (
                                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {debts.map(d => (
                                            <tr key={d.user_id}>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">{d.username}</td>
                                                <td className="px-6 py-3 text-sm text-gray-700">{d.mssv || "-"}</td>
                                                <td className="px-6 py-3 text-sm text-gray-700">{d.plates.join(", ") || "-"}</td>
                                                <td className="px-6 py-3 text-sm text-gray-700">{d.phone || "-"}</td>
                                                <td className="px-6 py-3 text-sm font-bold text-red-600">{money(d.debt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Panel>
                </div>

                <div className="space-y-4">
                    {/* Edge devices */}
                    <Panel title="Máy trạm cổng" icon={Monitor} right={<span className="text-sm text-gray-500">{onlineDevices}/{devices.length} online</span>}>
                        <div className="p-3 space-y-2">
                            {devices.length === 0 && (
                                <p className="text-sm text-gray-500 p-2">
                                    Chưa đăng ký máy trạm. Chạy <code className="bg-gray-100 px-1 rounded">node scripts/edge-device.js create</code> trên server.
                                </p>
                            )}
                            {devices.map(d => (
                                <div key={d.id} className={`p-3 rounded-lg border ${d.online ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            {d.online ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
                                            <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{d.code}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-600">
                                        {LANE_LABEL[d.lane]}{d.lot_name ? ` · ${d.lot_name}` : ""} · {timeAgo(d.last_seen_at)}
                                    </div>
                                    {d.status === "revoked" && <div className="mt-1 text-xs font-semibold text-red-600">Đã thu hồi khóa</div>}
                                    {d.pending_events > 0 && (
                                        <div className="mt-1 text-xs font-semibold text-amber-700">{d.pending_events} sự kiện chờ đồng bộ</div>
                                    )}
                                </div>
                            ))}
                            {pendingEvents > 0 && (
                                <p className="text-xs text-amber-700 px-1">Máy trạm đang offline hoặc đang đẩy hàng chờ lên Cloud.</p>
                            )}
                        </div>
                    </Panel>

                    {/* Parking lots */}
                    <Panel title="Tình trạng bãi" icon={Map}>
                        <div className="p-3 space-y-3">
                            {parkingLots.map(lot => {
                                const pct = lot.capacity ? Math.min(100, Math.round((lot.occupied / lot.capacity) * 100)) : 0;
                                return (
                                    <div key={lot.id}>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-800">{lot.name}</span>
                                            <span className="text-gray-600">{lot.occupied}/{lot.capacity}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full mt-1">
                                            <div className={`h-2 rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-cyan-500"}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Panel>

                    {/* Quick actions */}
                    <Panel title="Thao tác nhanh" icon={SettingsIcon}>
                        <div className="p-3 grid grid-cols-1 gap-2">
                            {[
                                { id: "management", label: "Quản lý bãi", icon: Map, color: "from-cyan-500 to-cyan-600" },
                                { id: "history", label: "Lịch sử", icon: FileText, color: "from-violet-500 to-violet-600" },
                                { id: "admin", label: "Quản trị hệ thống", icon: SettingsIcon, color: "from-blue-500 to-blue-600" },
                            ].map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => onNavigate?.(a.id)}
                                    className={`bg-gradient-to-r ${a.color} text-white p-3 rounded-xl shadow hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                                >
                                    <a.icon className="h-5 w-5" />
                                    <span className="text-sm font-medium">{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </Panel>
                </div>
            </div>

            {preview && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <img src={preview} alt="Ảnh đối soát" className="max-h-[85vh] max-w-full rounded-lg shadow-2xl" />
                </div>
            )}
        </div>
    );
}
