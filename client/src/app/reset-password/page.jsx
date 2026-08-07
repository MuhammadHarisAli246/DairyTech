"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/src/components/Toast";
import { resetPassword } from "@/src/services/authService";
import {
    Lock,
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    KeyRound,
    CheckCircle,
} from "lucide-react";

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div className="spinner" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { addToast } = useToast();

    if (!token) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    background:
                        "radial-gradient(ellipse at top, #1a2332 0%, #121220 50%)",
                }}
            >
                <div
                    className="glass-card animate-scale-in"
                    style={{ padding: "40px", textAlign: "center", maxWidth: "420px", width: "100%" }}
                >
                    <h2
                        style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#f1f5f9",
                            marginBottom: "12px",
                        }}
                    >
                        Invalid Reset Link
                    </h2>
                    <p
                        style={{
                            color: "#94a3b8",
                            fontSize: "14px",
                            marginBottom: "24px",
                        }}
                    >
                        This password reset link is invalid or missing a token.
                        Please request a new one.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="btn-primary"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            fontSize: "15px",
                            textDecoration: "none",
                        }}
                    >
                        Request New Link
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            addToast("Please fill in all fields", "error");
            return;
        }

        if (password.length < 10) {
            addToast("Password must be at least 10 characters", "error");
            return;
        }

        if (
            !/[a-z]/.test(password) ||
            !/[A-Z]/.test(password) ||
            !/\d/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)
        ) {
            addToast(
                "Password must include uppercase, lowercase, number, and special character",
                "error"
            );
            return;
        }

        if (password !== confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
        } catch (error) {
            addToast(
                error.response?.data?.message || "Unable to reset password",
                "error"
            );
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
                background:
                    "radial-gradient(ellipse at top, #1a2332 0%, #121220 50%)",
            }}
        >
            <div
                className="animate-scale-in"
                style={{ width: "100%", maxWidth: "420px" }}
            >
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "36px",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "20px",
                            background:
                                "linear-gradient(135deg, #10b981, #059669)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "16px",
                            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        {success ? (
                            <CheckCircle size={28} color="#fff" />
                        ) : (
                            <KeyRound size={28} color="#fff" />
                        )}
                    </div>
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "800",
                            color: "#f1f5f9",
                        }}
                    >
                        {success ? "Password Reset" : "Set New Password"}
                    </h1>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "#64748b",
                            marginTop: "8px",
                        }}
                    >
                        {success
                            ? "Your password has been updated successfully."
                            : "Create a strong new password for your account."}
                    </p>
                </div>

                <div
                    className="glass-card"
                    style={{ padding: "32px" }}
                >
                    {success ? (
                        <div style={{ textAlign: "center" }}>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => router.push("/login")}
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
                                Sign In
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "20px" }}>
                                <label className="input-label">
                                    New Password
                                </label>
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
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        className="input-field"
                                        placeholder="Minimum 10 characters"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        style={{
                                            paddingLeft: "42px",
                                            paddingRight: "46px",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
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
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label className="input-label">
                                    Confirm Password
                                </label>
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
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        className="input-field"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        style={{ paddingLeft: "42px" }}
                                    />
                                </div>
                            </div>

                            <p
                                style={{
                                    marginBottom: "24px",
                                    fontSize: "12px",
                                    lineHeight: "1.5",
                                    color: "#94a3b8",
                                }}
                            >
                                Use uppercase, lowercase, a number, and a
                                special character.
                            </p>

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
                                    <div
                                        className="spinner"
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            borderWidth: "2px",
                                        }}
                                    />
                                ) : (
                                    <>
                                        Reset Password
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "24px",
                            fontSize: "14px",
                            color: "#64748b",
                        }}
                    >
                        <Link
                            href="/login"
                            style={{
                                color: "#10b981",
                                textDecoration: "none",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
