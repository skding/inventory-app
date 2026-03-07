"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Package, Plus, Search, LayoutDashboard, History as HistoryIcon, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, activeProjects: 0, recentTransactions: 0 });

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-bold text-slate-800">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-border-subtle p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Inventory</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active /></Link>
          <Link href="/inventory"><NavItem icon={<Package size={20} />} label="Inventory" /></Link>
          <Link href="/projects"><NavItem icon={<FolderKanban size={20} />} label="Projects" /></Link>
          <Link href="/transactions"><NavItem icon={<HistoryIcon size={20} />} label="Transactions" /></Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-border-subtle">
          <div className="flex items-center gap-3 mb-4 px-2 text-sm text-slate-400">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {session?.user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              {session?.user?.email}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-8 pb-24 md:pb-8 h-screen overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">Overview</h1>
          <div className="flex items-center gap-3">
            <button className="p-2.5 bg-bg-card border border-border-subtle rounded-xl text-slate-400 hover:text-white transition-colors">
              <Search size={22} />
            </button>
            <button className="p-2.5 bg-primary rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus size={22} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Items" value={stats.totalItems.toString()} />
          <StatCard label="Active Projects" value={stats.activeProjects.toString()} />
          <StatCard label="Recent Transactions" value={stats.recentTransactions.toString()} />
        </div>

        {/* Quick Actions (Mobile Friendly) */}
        <h2 className="text-sm font-semibold mb-4 text-slate-500 uppercase tracking-widest">Quick Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/scan" className="block">
            <ActionCard color="bg-emerald-500" icon={<Plus />} title="Stock Inbound" description="Scan items to ADD to inventory" />
          </Link>
          <Link href="/scan" className="block">
            <ActionCard color="bg-rose-500" icon={<LogOut />} title="Stock Outbound" description="Scan items to REMOVE for projects" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/inventory" className="premium-card p-6 flex flex-col gap-3 hover:border-primary/40 transition-all group">
            <div className="bg-primary/20 p-2.5 rounded-xl w-fit group-hover:bg-primary/30 transition-colors">
              <Package className="text-primary w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">View Inventory</h3>
              <p className="text-slate-400 text-sm">Full list of tracked items and stock levels</p>
            </div>
          </Link>
          <Link href="/projects" className="premium-card p-6 flex flex-col gap-3 hover:border-primary/40 transition-all group">
            <div className="bg-primary/20 p-2.5 rounded-xl w-fit group-hover:bg-primary/30 transition-colors">
              <FolderKanban className="text-primary w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Manage Projects</h3>
              <p className="text-slate-400 text-sm">Create and archive project destinations</p>
            </div>
          </Link>
        </div>

        {/* Bottom Nav - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card/90 backdrop-blur-lg border-t border-border-subtle flex justify-around items-center p-4 z-50">
          <Link href="/"><MobileNavItem icon={<LayoutDashboard />} active /></Link>
          <Link href="/inventory"><MobileNavItem icon={<Package />} /></Link>
          <Link href="/scan">
            <div className="relative -top-6 bg-primary p-4 rounded-full shadow-xl shadow-primary/30 text-white">
              <Plus size={24} />
            </div>
          </Link>
          <Link href="/projects"><MobileNavItem icon={<FolderKanban />} /></Link>
          <Link href="/transactions"><MobileNavItem icon={<HistoryIcon />} /></Link>
        </nav>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}

function MobileNavItem({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={`p-2 rounded-lg ${active ? 'text-primary' : 'text-slate-400'}`}>
      {icon}
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="premium-card p-6 flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-medium">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  );
}

function ActionCard({ color, icon, title, description }: { color: string, icon: React.ReactNode, title: string, description: string }) {
  const iconColorClass = `text-${color.split('-')[1]}-500`;
  return (
    <div className="premium-card p-5 group cursor-pointer hover:border-primary/50 transition-all active:scale-95">
      <div className={`${color}/20 p-2.5 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform ${iconColorClass}`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
