"use client";

import { useState, useEffect } from "react";
import { Package, Search, Loader2, AlertCircle, Trash2, Tag, ChevronDown, Plus, Minus, ArrowDownLeft, ArrowUpRight, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Category = {
    id: string;
    name: string;
    color: string | null;
};

type Project = {
    id: string;
    name: string;
};

type Item = {
    id: string;
    sku: string | null;
    barcode: string;
    name: string;
    description: string | null;
    quantity: number;
    unit_of_measure: string | null;
    created_at: string;
    category_id: string | null;
    category: Category | null;
};

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
    const [mounted, setMounted] = useState(false);

    // Quick Operation Modal State
    const [quickOpModal, setQuickOpModal] = useState<{
        item: Item;
        type: "IN" | "OUT";
    } | null>(null);
    const [opQuantity, setOpQuantity] = useState<number>(1);
    const [opProjectId, setOpProjectId] = useState<string>("");
    const [opSubmitting, setOpSubmitting] = useState(false);
    const [opMessage, setOpMessage] = useState<{ text: string; error?: boolean } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes, projRes] = await Promise.all([
                fetch("/api/items"),
                fetch("/api/categories"),
                fetch("/api/projects"),
            ]);
            const itemData = await itemRes.json();
            const catData = await catRes.json();
            const projData = await projRes.json();
            setItems(Array.isArray(itemData) ? itemData : []);
            setCategories(Array.isArray(catData) ? catData : []);
            setProjects(Array.isArray(projData) ? projData.filter((p: any) => !p.is_archived) : []);
        } catch (err) {
            console.error("Failed to fetch inventory data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await fetch(`/api/items?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete item");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting item");
        }
    };

    const handleUpdateItemCategory = async (itemId: string, newCategoryId: string) => {
        const catId = newCategoryId === "NONE" ? null : newCategoryId;
        try {
            const res = await fetch("/api/items", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, category_id: catId }),
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to update item category");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openQuickOp = (item: Item, type: "IN" | "OUT") => {
        setQuickOpModal({ item, type });
        setOpQuantity(1);
        setOpProjectId("");
        setOpMessage(null);
    };

    const handleConfirmQuickOp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickOpModal) return;

        if (opQuantity <= 0) {
            setOpMessage({ text: "Quantity must be greater than 0", error: true });
            return;
        }

        if (quickOpModal.type === "OUT" && quickOpModal.item.quantity < opQuantity) {
            setOpMessage({ text: "Insufficient stock available", error: true });
            return;
        }

        setOpSubmitting(true);
        setOpMessage(null);

        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    barcode: quickOpModal.item.barcode,
                    type: quickOpModal.type,
                    quantity: opQuantity,
                    project_id: opProjectId || null,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setOpMessage({ text: `${quickOpModal.type} recorded successfully!` });
                setTimeout(() => {
                    setQuickOpModal(null);
                    fetchData();
                }, 1000);
            } else {
                setOpMessage({ text: data.message || "Failed to process operation", error: true });
            }
        } catch (err) {
            console.error(err);
            setOpMessage({ text: "An error occurred during transaction", error: true });
        } finally {
            setOpSubmitting(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    if (!mounted) return null;

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.barcode.toLowerCase().includes(search.toLowerCase()) ||
            item.sku?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.name.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCategoryFilter === "ALL") return true;
        if (selectedCategoryFilter === "NONE") return !item.category_id;
        return item.category_id === selectedCategoryFilter;
    });

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 pb-24 md:pb-8">
            <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-3">
                        <Package className="text-primary" /> Inventory
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Link href="/categories" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium text-sm flex items-center gap-2 transition-colors">
                        <Tag size={16} className="text-primary" /> Manage Categories
                    </Link>
                    <Link href="/scan" className="btn-primary">
                        <Search size={20} /> <span className="hidden sm:inline">Scan Code</span>
                    </Link>
                </div>
            </header>

            {/* Filters */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, barcode, SKU, or category..."
                        className="w-full input-field pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Category Filter Dropdown */}
                <div className="relative min-w-[200px]">
                    <select
                        className="w-full input-field appearance-none pr-10 cursor-pointer text-slate-200"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        <option value="NONE">Uncategorized</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : filteredItems.length === 0 ? (
                    <div className="premium-card p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                        <AlertCircle size={48} className="opacity-20" />
                        <p>No items found matching your filter.</p>
                        <Link href="/scan" className="text-primary font-semibold">Start scanning to add items</Link>
                    </div>
                ) : (
                    <div className="premium-card overflow-hidden border-none text-slate-300">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-semibold">Item Details</th>
                                        <th className="px-6 py-4 font-semibold">Category</th>
                                        <th className="px-6 py-4 font-semibold">SKU / Barcode</th>
                                        <th className="px-6 py-4 font-semibold">Quantity</th>
                                        <th className="px-6 py-4 font-semibold text-center">Quick Stock Ops</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-200">{item.name}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{item.description || "No description"}</div>
                                            </td>

                                            {/* Category Column */}
                                            <td className="px-6 py-4">
                                                <div className="relative inline-block group/cat">
                                                    <select
                                                        value={item.category_id || "NONE"}
                                                        onChange={(e) => handleUpdateItemCategory(item.id, e.target.value)}
                                                        className="appearance-none bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 cursor-pointer pr-6 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="NONE" className="bg-[#0f172a] text-slate-400">Uncategorized</option>
                                                        {categories.map((c) => (
                                                            <option key={c.id} value={c.id} className="bg-[#0f172a] text-slate-200">
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-slate-400">{item.sku || "N/A"}</div>
                                                <div className="text-[10px] text-slate-500">{item.barcode}</div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${item.quantity < 5 ? "text-amber-500" : "text-emerald-500"}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-xs text-slate-500 uppercase">{item.unit_of_measure || "pcs"}</span>
                                                </div>
                                            </td>

                                            {/* Quick Operation Column (Inbound / Outbound Buttons) */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openQuickOp(item, "IN")}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95"
                                                        title="Quick Inbound Stock"
                                                    >
                                                        <ArrowDownLeft size={14} /> + Inbound
                                                    </button>

                                                    <button
                                                        onClick={() => openQuickOp(item, "OUT")}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all active:scale-95"
                                                        title="Quick Outbound Stock"
                                                    >
                                                        <ArrowUpRight size={14} /> - Outbound
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-2 transition-opacity md:opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500"
                                                    title="Delete Item"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Quick Inbound / Outbound Operation */}
            {quickOpModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="premium-card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${quickOpModal.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {quickOpModal.type === 'IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">
                                        Quick {quickOpModal.type === "IN" ? "Inbound (+)" : "Outbound (-)"}
                                    </h2>
                                    <p className="text-xs text-slate-400 font-mono">{quickOpModal.item.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setQuickOpModal(null)}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmQuickOp} className="space-y-5">
                            <div className="p-3 bg-white/5 rounded-xl flex justify-between items-center text-xs text-slate-300">
                                <span>Current Stock:</span>
                                <span className="font-bold text-sm text-slate-100">
                                    {quickOpModal.item.quantity} {quickOpModal.item.unit_of_measure || "pcs"}
                                </span>
                            </div>

                            {/* Quantity Control */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Transaction Quantity</label>
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setOpQuantity(Math.max(1, opQuantity - 1))}
                                        className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg hover:bg-white/20 active:scale-95 transition-all text-slate-200"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="flex-1 bg-transparent text-center text-xl font-bold focus:outline-none text-white"
                                        value={opQuantity}
                                        onChange={(e) => setOpQuantity(parseInt(e.target.value) || 1)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setOpQuantity(opQuantity + 1)}
                                        className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg hover:bg-white/20 active:scale-95 transition-all text-slate-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Project Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Project / Purpose (Optional)</label>
                                <div className="relative">
                                    <select
                                        className="w-full input-field appearance-none pr-8 text-sm"
                                        value={opProjectId}
                                        onChange={(e) => setOpProjectId(e.target.value)}
                                    >
                                        <option value="">No Project (General Stock)</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {opMessage && (
                                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${opMessage.error ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {opMessage.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                                    <span>{opMessage.text}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setQuickOpModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={opSubmitting}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all ${quickOpModal.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'}`}
                                >
                                    {opSubmitting ? <Loader2 className="animate-spin" size={18} /> : `Confirm ${quickOpModal.type}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
