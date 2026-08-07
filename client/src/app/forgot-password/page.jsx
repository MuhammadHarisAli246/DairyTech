"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/src/components/Toast";
import { forgotPassword } from "@/src/services/authService";
import { Mail, ArrowLeft, ArrowRight, Send } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            addToast("Please enter your email address", "error");
            return;
        }

        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (error) {
            addToast(
                error.response?.data?.message || "Unable to send reset link",
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
                        <Send size={28} color="#fff" />
                    </div>
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "800",
                            color: "#f1f5f9",
                        }}
                    >
                        {sent ? "Check Your Email" : "Forgot Password?"}
                    </h1>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "#64748b",
                            marginTop: "8px",
                        }}
                    >
                        {sent
                            ? "If an account exists with that email, we've sent a reset link."
                            : "Enter your email and we'll send you a reset link."}
                    </p>
                </div>

                <div
                    className="glass-card"
                    style={{ padding: "32px" }}
                >
                    {sent ? (
                        <div style={{ textAlign: "center" }}>
                            <p
                                style={{
                                    color: "#94a3b8",
                                    fontSize: "14px",
                                    lineHeight: "1.6",
                                    marginBottom: "24px",
                                }}
                            >
                                The reset link expires in{" "}
                                <strong style={{ color: "#f1f5f9" }}>
                                    15 minutes
                                </strong>
                                . Check your inbox and click the link to set a
                                new password.
                            </p>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => {
                                    setSent(false);
                                    setEmail("");
                                }}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    fontSize: "15px",
                                }}
                            >
                                Send Another Link
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: "24px" }}>
                                <label className="input-label">
                                    Email Address
                                </label>
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
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        style={{ paddingLeft: "42px" }}
                                    />
                                </div>
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
                                        Send Reset Link
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
