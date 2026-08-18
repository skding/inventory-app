"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings as SettingsIcon, KeyRound, CheckCircle2, AlertCircle, Loader2, ShieldCheck, User } from "lucide-react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");
    const [message, setMessage] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("IDLE");

        if (newPassword !== confirmPassword) {
            setStatus("ERROR");
            setMessage("New passwords do not match");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setStatus("ERROR");
            setMessage("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("SUCCESS");
                setMessage(data.message || "Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setStatus("ERROR");
                setMessage(data.message || "Failed to change password");
            }
        } catch (err: any) {
            console.error("Change password error:", err);
            setStatus("ERROR");
            setMessage("An error occurred while changing password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 pb-24 md:pb-8 text-slate-200">
            <header className="max-w-4xl mx-auto mb-8">
                <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-3">
                    <SettingsIcon className="text-primary" /> Settings
                </h1>
                <p className="text-slate-400 text-sm mt-1">Manage your account preferences and security</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Overview Card */}
                <div className="premium-card p-6 md:p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl border border-primary/30">
                            {session?.user?.email?.[0]?.toUpperCase() || <User />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{session?.user?.email}</h2>
                            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck size={16} className="text-emerald-400" /> Authenticated Account
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="premium-card p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <div className="bg-amber-500/20 p-2.5 rounded-xl">
                            <KeyRound className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Change Password</h2>
                            <p className="text-xs text-slate-400">Ensure your account uses a strong, secure password</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Current Password</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full input-field"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full input-field"
                                placeholder="Enter new password (min. 6 chars)"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full input-field"
                                placeholder="Confirm new password"
                            />
                        </div>

                        {status !== "IDLE" && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                                {status === "SUCCESS" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="text-sm font-medium">{message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-12 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
