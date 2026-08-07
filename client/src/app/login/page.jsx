"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import { loginUser } from "@/src/services/authService";
import { useToast } from "@/src/components/Toast";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, login, loading: authLoading } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner" />
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            addToast("Please fill in all fields", "error");
            return;
        }
        setLoading(true);
        try {
            const data = await loginUser({ email, password });
            login(data.user);
            addToast("Login successful!", "success");
            router.push("/dashboard");
        } catch (error) {
            addToast(error.response?.data?.message || "Login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "radial-gradient(ellipse at top, #1a2332 0%, #121220 50%)",
            }}
        >
            <div className="animate-scale-in" style={{ width: "100%", maxWidth: "420px" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "32px",
                            marginBottom: "16px",
                            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        🥛
                    </div>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#f1f5f9" }}>
                        Welcome Back
                    </h1>
                    <p style={{ fontSize: "14px", color: "#64748b", marginTop: "8px" }}>
                        Sign in to your DairyTech account
                    </p>
                </div>

                {/* Form */}
                <div className="glass-card" style={{ padding: "32px" }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "20px" }}>
                            <label className="input-label">Email Address</label>
                            <div style={{ position: "relative" }}>
                                <Mail
                                    size={18}
                                    style={{
                                        position: "absolute",
                                        left: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#64748b",
                                    }}
                                />
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "28px" }}>
                            <label className="input-label">Password</label>
                            <div style={{ position: "relative" }}>
                                <Lock
                                    size={18}
                                    style={{
                                        position: "absolute",
                                        left: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#64748b",
                                    }}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingLeft: "42px", paddingRight: "42px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "14px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "28px", textAlign: "right" }}>
                            <Link
                                href="/forgot-password"
                                style={{
                                    color: "#10b981",
                                    textDecoration: "none",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                }}
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                padding: "14px",
                                fontSize: "15px",
                            }}
                        >
                            {loading ? (
                                <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "24px",
                            fontSize: "14px",
                            color: "#64748b",
                        }}
                    >
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            style={{ color: "#10b981", textDecoration: "none", fontWeight: "600" }}
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
