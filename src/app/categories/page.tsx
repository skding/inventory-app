"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, Edit2, Trash2, Loader2, AlertCircle, Search, Layers, X, Check, ArrowRight, FolderPlus } from "lucide-react";

type CategoryItem = {
    id: string;
    name: string;
    barcode: string;
    quantity: number;
    unit_of_measure: string | null;
};

type Category = {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    created_at: string;
    _count: { items: number };
    items: CategoryItem[];
};

type Item = {
    id: string;
    name: string;
    barcode: string;
    category_id: string | null;
    category?: { id: string; name: string; color: string | null } | null;
};

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#f43f5e", // Rose
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#64748b", // Slate
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Form inputs
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formColor, setFormColor] = useState("#3b82f6");
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Manage items inside modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, itemRes] = await Promise.all([
                fetch("/api/categories"),
                fetch("/api/items"),
            ]);
            const catData = await catRes.json();
            const itemData = await itemRes.json();
            setCategories(Array.isArray(catData) ? catData : []);
            setAllItems(Array.isArray(itemData) ? itemData : []);

            // If selectedCategory is set, update its reference
            if (selectedCategory && Array.isArray(catData)) {
                const refreshed = catData.find((c: Category) => c.id === selectedCategory.id);
                setSelectedCategory(refreshed || null);
            }
        } catch (err) {
            console.error("Failed to fetch categories or items", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, []);

    if (!mounted) return null;

    const resetForm = () => {
        setFormName("");
        setFormDesc("");
        setFormColor("#3b82f6");
        setFormError("");
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setFormName(cat.name);
        setFormDesc(cat.description || "");
        setFormColor(cat.color || "#3b82f6");
        setFormError("");
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            setFormError("Category name is required");
            return;
        }

        setFormSubmitting(true);
        setFormError("");

        try {
            const isEdit = !!editingCategory;
            const url = "/api/categories";
            const method = isEdit ? "PUT" : "POST";
            const payload = {
                ...(isEdit ? { id: editingCategory.id } : {}),
                name: formName.trim(),
                description: formDesc.trim(),
                color: formColor,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok) {
                setIsCreateOpen(false);
                setEditingCategory(null);
                resetForm();
                fetchData();
            } else {
                setFormError(data.message || "Failed to save category");
            }
        } catch (err) {
            console.error(err);
            setFormError("An error occurred while saving");
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteCategory = async (cat: Category) => {
        if (!confirm(`Are you sure you want to delete category "${cat.name}"? Items inside will become uncategorized.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/categories?id=${cat.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                if (selectedCategory?.id === cat.id) {
                    setSelectedCategory(null);
                }
                fetchData();
            } else {
                alert("Failed to delete category");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting category");
        }
    };

    const handleRemoveItemFromCategory = async (itemId: string) => {
        try {
            const res = await fetch("/api/items", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, category_id: null }),
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to remove item from category");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignItemToCategory = async (itemId: string, catId: string) => {
        try {
            const res = await fetch("/api/items", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, category_id: catId }),
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to assign item to category");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 pb-24 md:pb-8 text-slate-200">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 max-w-6xl mx-auto gap-4">
                <div>
                    <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-3">
                        <Tag className="text-primary" /> Categories
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Organize your inventory items into structured categories</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2 self-start md:self-auto"
                >
                    <Plus size={20} /> New Category
                </button>
            </header>

            {/* Search and Stats */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories by name or description..."
                        className="w-full input-field pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Categories List */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : filteredCategories.length === 0 ? (
                    <div className="premium-card p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                        <Layers size={48} className="opacity-20" />
                        <p>No categories found.</p>
                        <button onClick={openCreateModal} className="text-primary font-semibold hover:underline">
                            Create your first category
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((cat) => {
                            const badgeColor = cat.color || "#3b82f6";
                            return (
                                <div
                                    key={cat.id}
                                    className="premium-card p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative overflow-hidden"
                                >
                                    {/* Top Color Accent Line */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1.5"
                                        style={{ backgroundColor: badgeColor }}
                                    />

                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                                    style={{ backgroundColor: badgeColor }}
                                                />
                                                <h3 className="font-bold text-lg text-slate-100 group-hover:text-primary transition-colors">
                                                    {cat.name}
                                                </h3>
                                            </div>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 font-mono">
                                                {cat._count?.items || 0} items
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-400 mb-6 line-clamp-2 min-h-[2.5rem]">
                                            {cat.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-slate-400">
                                        <button
                                            onClick={() => setSelectedCategory(cat)}
                                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                            View Items <ArrowRight size={14} />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(cat)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                                title="Edit Category"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat)}
                                                className="p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
                                                title="Delete Category"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Create or Edit Category */}
            {(isCreateOpen || editingCategory) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="premium-card max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Tag className="text-primary" size={20} />
                                {editingCategory ? "Edit Category" : "New Category"}
                            </h2>
                            <button
                                onClick={() => { setIsCreateOpen(false); setEditingCategory(null); }}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Electronics, Tools, Fasteners"
                                    className="w-full input-field"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Description (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Short summary of items in this category..."
                                    className="w-full input-field resize-none"
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                />
                            </div>

                            {/* Color Selection with Preset Palette and Custom Color Picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 flex justify-between items-center">
                                    <span>Category Color Tag</span>
                                    <span className="font-mono text-xs text-slate-400">{formColor}</span>
                                </label>

                                <div className="space-y-3">
                                    {/* Preset Swatches */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormColor(color)}
                                                className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${formColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {formColor === color && <Check size={14} className="text-white drop-shadow" />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Color Picker Input */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <div className="relative flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex-1">
                                            <input
                                                type="color"
                                                id="customColor"
                                                value={formColor}
                                                onChange={(e) => setFormColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                            />
                                            <label htmlFor="customColor" className="text-xs text-slate-300 cursor-pointer font-medium">
                                                Pick custom color
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formError && (
                                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreateOpen(false); setEditingCategory(null); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 font-semibold"
                                >
                                    {formSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingCategory ? "Update" : "Create")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal / Drawer: Category Items Detail */}
            {selectedCategory && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="premium-card max-w-2xl w-full p-6 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: selectedCategory.color || "#3b82f6" }}
                                />
                                <div>
                                    <h2 className="text-xl font-bold">{selectedCategory.name}</h2>
                                    <p className="text-xs text-slate-400">{selectedCategory.description || "No description"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Category Items Header & Action */}
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h3 className="font-semibold text-sm text-slate-300">
                                Assigned Items ({selectedCategory.items?.length || 0})
                            </h3>
                            <button
                                onClick={() => setIsAssignModalOpen(true)}
                                className="text-xs btn-primary py-1.5 px-3 flex items-center gap-1.5"
                            >
                                <FolderPlus size={14} /> Add Items to Category
                            </button>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-y-auto flex-1 pr-1 space-y-2">
                            {(!selectedCategory.items || selectedCategory.items.length === 0) ? (
                                <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-xl">
                                    No items in this category yet. Click "Add Items to Category" to assign items.
                                </div>
                            ) : (
                                selectedCategory.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-colors"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-200 text-sm">{item.name}</div>
                                            <div className="text-xs font-mono text-slate-400">Barcode: {item.barcode}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Qty: {item.quantity} {item.unit_of_measure || "pcs"}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveItemFromCategory(item.id)}
                                                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors border border-rose-500/20"
                                                title="Remove item from category"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/10 flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="px-5 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-modal: Assign Unassigned/Other Items to Selected Category */}
            {isAssignModalOpen && selectedCategory && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="premium-card max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Plus size={18} className="text-primary" />
                                Add Items to "{selectedCategory.name}"
                            </h3>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search items by name or barcode..."
                                className="w-full input-field pl-10 text-sm"
                                value={assignSearch}
                                onChange={(e) => setAssignSearch(e.target.value)}
                            />
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                            {allItems
                                .filter((item) => item.category_id !== selectedCategory.id)
                                .filter((item) =>
                                    item.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
                                    item.barcode.toLowerCase().includes(assignSearch.toLowerCase())
                                )
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5"
                                    >
                                        <div>
                                            <div className="font-medium text-slate-200 text-sm">{item.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {item.category ? `Current: ${item.category.name}` : "Uncategorized"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                await handleAssignItemToCategory(item.id, selectedCategory.id);
                                            }}
                                            className="btn-primary py-1 px-3 text-xs flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                ))}
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
