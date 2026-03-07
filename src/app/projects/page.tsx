"use client";

import { useState, useEffect } from "react";
import { FolderKanban, Plus, Archive, ArchiveRestore, Loader2, ArrowLeft, MoreVertical, Search } from "lucide-react";
import Link from "next/link";

type Project = {
    id: string;
    name: string;
    description: string | null;
    is_archived: boolean;
    created_at: string;
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleArchive = async (id: string, current: boolean) => {
        try {
            await fetch(`/api/projects/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_archived: !current }),
            });
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchProjects();
    }, []);

    if (!mounted) return null;

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, description: newDesc }),
            });
            if (res.ok) {
                setNewName("");
                setNewDesc("");
                setShowAddModal(false);
                fetchProjects();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    const activeProjects = filteredProjects.filter(p => !p.is_archived);
    const archivedProjects = filteredProjects.filter(p => p.is_archived);

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 pb-24 md:pb-8">
            <header className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <ArrowLeft className="text-slate-400" />
                    </Link>
                    <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-3">
                        <FolderKanban className="text-primary" /> Projects
                    </h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">New Project</span>
                </button>
            </header>

            <div className="max-w-5xl mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full input-field pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-8">
                <section>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Active Projects ({activeProjects.length})</h2>
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : activeProjects.length === 0 ? (
                        <div className="premium-card p-12 text-center text-slate-500">No active projects found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeProjects.map(project => (
                                <ProjectCard key={project.id} project={project} onArchive={toggleArchive} />
                            ))}
                        </div>
                    )}
                </section>

                {archivedProjects.length > 0 && (
                    <section>
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Archived</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                            {archivedProjects.map(project => (
                                <ProjectCard key={project.id} project={project} onArchive={toggleArchive} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="premium-card w-full max-w-md p-8 animate-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
                        <form onSubmit={handleAddProject} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Project Name</label>
                                <input
                                    autoFocus
                                    className="w-full input-field"
                                    placeholder="e.g. Office Renovation"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Description</label>
                                <textarea
                                    className="w-full input-field min-h-[100px]"
                                    placeholder="Project details..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors border border-border-subtle"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-primary"
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : "Create Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProjectCard({ project, onArchive }: { project: Project, onArchive: (id: string, current: boolean) => void }) {
    return (
        <div className="premium-card p-6 group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{project.name}</h3>
                <button
                    onClick={() => onArchive(project.id, project.is_archived)}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                    title={project.is_archived ? "Restore" : "Archive"}
                >
                    {project.is_archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                </button>
            </div>
            <p className="text-slate-400 text-sm line-clamp-2 min-h-[2.5rem] mb-4">
                {project.description || "No description provided."}
            </p>
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                <span className={project.is_archived ? "text-amber-500" : "text-emerald-500"}>
                    {project.is_archived ? "Archived" : "Active"}
                </span>
            </div>
        </div>
    );
}
