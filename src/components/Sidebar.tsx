"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Package, LayoutDashboard, History as HistoryIcon, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-border-subtle p-6 h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-primary/20 p-2 rounded-xl">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Inventory</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} /></Link>
          <Link href="/inventory"><NavItem icon={<Package size={20} />} label="Inventory" active={pathname === "/inventory"} /></Link>
          <Link href="/projects"><NavItem icon={<FolderKanban size={20} />} label="Projects" active={pathname === "/projects"} /></Link>
          <Link href="/transactions"><NavItem icon={<HistoryIcon size={20} />} label="Transactions" active={pathname === "/transactions"} /></Link>
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

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card/90 backdrop-blur-lg border-t border-border-subtle flex justify-around items-center p-4 z-50">
        <Link href="/"><MobileNavItem icon={<LayoutDashboard />} active={pathname === "/"} /></Link>
        <Link href="/inventory"><MobileNavItem icon={<Package />} active={pathname === "/inventory"} /></Link>
        <Link href="/scan">
          <div className="relative -top-6 bg-primary p-4 rounded-full shadow-xl shadow-primary/30 text-white">
            <Plus size={24} />
          </div>
        </Link>
        <Link href="/projects"><MobileNavItem icon={<FolderKanban />} active={pathname === "/projects"} /></Link>
        <Link href="/transactions"><MobileNavItem icon={<HistoryIcon />} active={pathname === "/transactions"} /></Link>
      </nav>
    </>
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
