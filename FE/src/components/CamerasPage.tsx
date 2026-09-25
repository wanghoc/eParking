import { useState, useEffect, useCallback } from "react";
import { Video, Plus, Trash2, Play, Square } from "lucide-react";
import { apiUrl, getAuthToken } from "../api";

interface Camera {
    id: number;
    name: string;
    location: string | null;
    rtsp_url: string;
}

const authHeaders = () => ({ Authorization: `Bearer ${getAuthToken()}` });

export function CamerasPage() {
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", location: "", rtsp_url: "" });
    const [saving, setSaving] = useState(false);
    const [watching, setWatching] = useState<Set<number>>(new Set());
    const [failed, setFailed] = useState<Set<number>>(new Set());

    const load = useCallback(async () => {
        try {
            const res = await fetch(apiUrl("/admin/cameras"), { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) {
                setError(res.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại." : data.message || "Lỗi tải camera");
                return;
            }
            setError("");
            setCameras(data);
        } catch {
            setError("Không thể kết nối đến server");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const toggleSet = (setter: typeof setWatching, id: number, on: boolean) =>
        setter((prev) => {
            const next = new Set(prev);
            if (on) next.add(id);
            else next.delete(id);
            return next;
        });

    const addCamera = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(apiUrl("/admin/cameras"), {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Lỗi thêm camera");
                return;
            }
            setForm({ name: "", location: "", rtsp_url: "" });
            await load();
        } catch {
            setError("Không thể kết nối đến server");
        } finally {
            setSaving(false);
        }
    };

    const removeCamera = async (cam: Camera) => {
        if (!window.confirm(`Xóa camera "${cam.name}"?`)) return;
        try {
            const res = await fetch(apiUrl(`/admin/cameras/${cam.id}`), { method: "DELETE", headers: authHeaders() });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message || "Lỗi xóa camera");
                return;
            }
            toggleSet(setWatching, cam.id, false);
            await load();
        } catch {
            setError("Không thể kết nối đến server");
        }
    };

    const start = (id: number) => {
        toggleSet(setFailed, id, false);
        toggleSet(setWatching, id, true);
    };

    // Thẻ <img> không gửi được header nên token đi kèm query.
    const streamSrc = (id: number) => apiUrl(`/admin/cameras/${id}/stream?token=${encodeURIComponent(getAuthToken())}`);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Video className="h-6 w-6 text-cyan-600" /> Camera giám sát
                </h1>
                <p className="text-gray-600 mt-1">Thêm camera IP (RTSP) và xem trực tiếp từ xa.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <form onSubmit={addCamera} className="bg-white rounded-xl border border-gray-200 p-4 grid gap-3 md:grid-cols-4">
                <input
                    required
                    placeholder="Tên camera"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                    placeholder="Vị trí (tuỳ chọn)"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                    required
                    placeholder="rtsp://user:pass@ip:554/stream1"
                    value={form.rtsp_url}
                    onChange={(e) => setForm({ ...form, rtsp_url: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:col-span-1"
                />
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium"
                >
                    <Plus className="h-4 w-4" /> {saving ? "Đang thêm..." : "Thêm camera"}
                </button>
            </form>

            {loading ? (
                <p className="text-gray-500">Đang tải...</p>
            ) : cameras.length === 0 ? (
                <p className="text-gray-500">Chưa có camera nào.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {cameras.map((cam) => (
                        <div key={cam.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{cam.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{cam.location || cam.rtsp_url}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {watching.has(cam.id) ? (
                                        <button onClick={() => toggleSet(setWatching, cam.id, false)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100" title="Dừng xem">
                                            <Square className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => start(cam.id)} className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-50" title="Xem trực tiếp">
                                            <Play className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button onClick={() => removeCamera(cam)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" title="Xóa">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="aspect-video bg-black flex items-center justify-center text-sm text-gray-400">
                                {watching.has(cam.id) ? (
                                    failed.has(cam.id) ? (
                                        <div className="text-center px-4">
                                            <p className="text-red-400">Không kết nối được camera</p>
                                            <button onClick={() => start(cam.id)} className="mt-2 underline text-gray-300">Thử lại</button>
                                        </div>
                                    ) : (
                                        <img
                                            src={streamSrc(cam.id)}
                                            alt={cam.name}
                                            className="w-full h-full object-contain"
                                            onError={() => toggleSet(setFailed, cam.id, true)}
                                        />
                                    )
                                ) : (
                                    "Nhấn ▶ để xem"
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
