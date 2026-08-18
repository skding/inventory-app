"use client";

import { useState, useEffect } from "react";
import { Package, Search, Loader2, AlertCircle, Trash2, Tag, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";

type Category = {
    id: string;
    name: string;
    color: string | null;
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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
    const [mounted, setMounted] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemRes, catRes] = await Promise.all([
                fetch("/api/items"),
                fetch("/api/categories"),
            ]);
            const itemData = await itemRes.json();
            const catData = await catRes.json();
            setItems(Array.isArray(itemData) ? itemData : []);
            setCategories(Array.isArray(catData) ? catData : []);
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

                                            {/* Category Column with Quick Category Selector */}
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
        </div>
    );
}
