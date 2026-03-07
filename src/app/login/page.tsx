"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2, Package } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#0f172a]">
            <div className="w-full max-w-md premium-card p-8 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/20 p-3 rounded-2xl mb-4">
                        <Package className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-slate-400 mt-2">Sign in to manage your inventory</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full input-field text-slate-200"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full input-field text-slate-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary h-12 text-base mt-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
                    </button>
                </form>

            </div>
        </div>
    );
}
