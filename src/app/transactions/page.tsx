"use client";

import { useState, useEffect } from "react";
import { History, Search, Loader2, ArrowUpRight, ArrowDownLeft, Calendar, User, FolderKanban } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Transaction = {
    id: string;
    type: "IN" | "OUT";
    quantity: number;
    timestamp: string;
    item: {
        name: string;
        barcode: string;
    };
    project: {
        name: string;
    } | null;
    user: {
        email: string;
    };
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/transactions");
            const data = await res.json();
            setTransactions(data);
        } catch (err) {
            console.error("Transactions fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchTransactions();
    }, []);

    if (!mounted) return null;

    const filteredTransactions = transactions.filter(t =>
        t.item.name.toLowerCase().includes(search.toLowerCase()) ||
        t.item.barcode.toLowerCase().includes(search.toLowerCase()) ||
        t.project?.name.toLowerCase().includes(search.toLowerCase()) ||
        t.user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 pb-24 md:pb-8">
            <header className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-3">
                        <History className="text-primary" /> Audit Log
                    </h1>
                </div>
            </header>

            <div className="max-w-6xl mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search transactions by item, barcode, project, or user..."
                        className="w-full input-field pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="premium-card p-12 text-center text-slate-500">
                        <p>No transactions found matching your search.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((t) => (
                            <div key={t.id} className="premium-card p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:border-white/20 transition-all">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${t.type === 'IN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {t.type === 'IN' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-200 truncate">{t.item.name}</span>
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 font-mono">{t.item.barcode}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} /> {format(new Date(t.timestamp), "MMM d, yyyy HH:mm")}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <User size={14} /> {t.user.email}
                                        </span>
                                        {t.project && (
                                            <span className="flex items-center gap-1.5 text-primary/80">
                                                <FolderKanban size={14} /> {t.project.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className={`text-xl font-bold ${t.type === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {t.type === 'IN' ? '+' : '-'}{t.quantity}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                                        {t.type === 'IN' ? 'Stock Added' : 'Stock Issued'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
