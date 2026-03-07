"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Package, ArrowLeft, Loader2, CheckCircle2, AlertCircle, LogOut, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";

type Project = {
    id: string;
    name: string;
};

type Item = {
    id: string;
    name: string;
    barcode: string;
    quantity: number;
    unit_of_measure: string | null;
};

export default function ScanPage() {
    const [mode, setMode] = useState<"SELECT" | "SCAN" | "DETAILS">("SELECT");
    const [type, setType] = useState<"IN" | "OUT" | null>(null);
    const [barcode, setBarcode] = useState("");
    const [item, setItem] = useState<Item | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
    const [message, setMessage] = useState("");

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data.filter((p: any) => !p.is_archived));
        } catch (err) {
            console.error(err);
        }
    };

    const startScanner = () => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                supportedScanTypes: [0], // 0: Camera, 1: File
            },
            false
        );

        scannerRef.current.render(
            (decodedText) => {
                handleScanSuccess(decodedText);
            },
            (error) => {
                // console.warn(error);
            }
        );
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            scannerRef.current = null;
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (mode === "SCAN") {
            startScanner();
        } else {
            stopScanner();
        }
        return () => stopScanner();
    }, [mode, mounted]);

    if (!mounted) return null;

    const handleScanSuccess = async (text: string) => {
        setBarcode(text);
        stopScanner();
        setLoading(true);
        try {
            const res = await fetch(`/api/items?barcode=${text}`);
            const data = await res.json();
            if (data) {
                setItem(data);
                setMode("DETAILS");
            } else {
                // Handle new item logic or error
                setItem({ id: "", name: "New Item", barcode: text, quantity: 0, unit_of_measure: "pcs" });
                setMode("DETAILS");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async () => {
        setLoading(true);
        setStatus("IDLE");
        try {
            // If item is new (no ID), create it first
            if (!item?.id) {
                const createRes = await fetch("/api/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        barcode,
                        name: item?.name || "Scanned Item",
                        quantity: type === "IN" ? quantity : 0,
                        project_id: selectedProjectId || null
                    }),
                });

                if (!createRes.ok) {
                    const errorData = await createRes.json();
                    throw new Error(errorData.message || "Failed to create item");
                }

                // If it was IN, we already recorded the initial stock in create API
                if (type === "IN") {
                    setStatus("SUCCESS");
                    setMessage(`Item created and ${quantity} IN successfully`);
                    setTimeout(() => {
                        setMode("SELECT");
                        setQuantity(1);
                        setSelectedProjectId("");
                        setStatus("IDLE");
                    }, 2000);
                    return;
                }
            }

            // Normal transaction (for existing items or OUT for new ones)
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    barcode,
                    type,
                    quantity,
                    project_id: selectedProjectId || null,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setStatus("SUCCESS");
                setMessage(`${type} recorded successfully`);
                setTimeout(() => {
                    setMode("SELECT");
                    setQuantity(1);
                    setStatus("IDLE");
                }, 1500);
            } else {
                setStatus("ERROR");
                setMessage(data.message || "Failed to process");
            }
        } catch (err: any) {
            console.error("HandleTransaction error:", err);
            setStatus("ERROR");
            setMessage(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center p-6">
            <header className="w-full max-w-lg mb-8 flex justify-between items-center">
                <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold">Terminal</h1>
                <div className="w-10"></div>
            </header>

            {/* Mode: SELECT */}
            {mode === "SELECT" && (
                <div className="w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-2xl font-bold text-center mb-10">Choose Operation</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => { setType("IN"); setMode("SCAN"); }}
                            className="premium-card p-10 flex flex-col items-center gap-4 hover:border-emerald-500/50 transition-all active:scale-95 group"
                        >
                            <div className="bg-emerald-500/20 p-5 rounded-3xl group-hover:scale-110 transition-transform">
                                <Plus className="w-10 h-10 text-emerald-500" />
                            </div>
                            <span className="text-2xl font-bold">Inbound</span>
                            <p className="text-slate-400 text-sm">Add stock to inventory</p>
                        </button>
                        <button
                            onClick={() => { setType("OUT"); setMode("SCAN"); }}
                            className="premium-card p-10 flex flex-col items-center gap-4 hover:border-rose-500/50 transition-all active:scale-95 group"
                        >
                            <div className="bg-rose-500/20 p-5 rounded-3xl group-hover:scale-110 transition-transform">
                                <LogOut className="w-10 h-10 text-rose-500" />
                            </div>
                            <span className="text-2xl font-bold">Outbound</span>
                            <p className="text-slate-400 text-sm">Release items for project</p>
                        </button>
                    </div>
                </div>
            )}

            {/* Mode: SCAN */}
            {mode === "SCAN" && (
                <div className="w-full max-w-lg space-y-6 animate-in fade-in">
                    <div className="premium-card p-4 overflow-hidden relative">
                        <div id="reader" className="w-full rounded-2xl overflow-hidden grayscale contrast-125"></div>
                    </div>

                    <div className="premium-card p-6 flex flex-col gap-4">
                        <label className="text-sm font-medium text-slate-400">Manual Barcode Entry</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 input-field"
                                placeholder="Type barcode here..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && barcode) {
                                        handleScanSuccess(barcode);
                                    }
                                }}
                            />
                            <button
                                disabled={!barcode}
                                onClick={() => handleScanSuccess(barcode)}
                                className="btn-primary px-6 h-12"
                            >
                                Enter
                            </button>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-slate-400 mb-6">Position the barcode within the frame or type manually</p>
                        <button
                            onClick={() => setMode("SELECT")}
                            className="px-6 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Mode: DETAILS */}
            {mode === "DETAILS" && (
                <div className="w-full max-w-lg space-y-6 animate-in zoom-in duration-200">
                    <div className="premium-card p-8">
                        <div className={`w-fit p-3 rounded-2xl mb-6 ${type === 'IN' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                            <Package className={type === 'IN' ? 'text-emerald-500' : 'text-rose-500'} size={32} />
                        </div>

                        {item?.id === "" ? (
                            <div className="space-y-2 mb-4">
                                <label className="text-sm font-medium text-slate-400">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full input-field"
                                    placeholder="Enter item name..."
                                    value={item.name}
                                    onChange={(e) => setItem({ ...item, name: e.target.value })}
                                />
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold mb-2">{item?.name}</h2>
                        )}
                        <p className="text-slate-400 text-sm font-mono mb-8">{barcode}</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Project / Purpose (Optional)</label>
                                <div className="relative">
                                    <select
                                        className="w-full input-field appearance-none"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                    >
                                        <option value="">{type === 'IN' ? 'No project (General Stock)' : 'Select a project...'}</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-medium text-slate-400">Quantity</label>
                                    <span className="text-xs text-slate-500">Current: {item?.quantity} {item?.unit_of_measure}</span>
                                </div>
                                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl active:scale-90 transition-transform"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        className="flex-1 bg-transparent text-center text-2xl font-bold focus:outline-none"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xl active:scale-90 transition-transform"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {status !== "IDLE" && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {status === 'SUCCESS' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    <span className="text-sm font-medium">{message}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setMode("SCAN")}
                                    className="flex-1 px-4 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold"
                                >
                                    Rescan
                                </button>
                                <button
                                    disabled={loading || (type === 'OUT' && !selectedProjectId) || (item?.id === "" && !item.name)}
                                    onClick={handleTransaction}
                                    className={`flex-[2] btn-primary h-14 text-lg ${(loading || (type === 'OUT' && !selectedProjectId) || (item?.id === "" && !item.name)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : `Confirm ${type}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
