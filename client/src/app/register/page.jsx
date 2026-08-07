"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    User,
    Mail,
    Phone,
    Lock,
    ArrowRight,
    Eye,
    EyeOff,
} from "lucide-react";

import { registerUser } from "@/src/services/authService";
import { useToast } from "@/src/components/Toast";
import { useAuth } from "@/src/hooks/useAuth";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        if (!authLoading && user) {
            router.replace("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phoneNo.replace(/\D/g, "");

        if (!cleanName || !cleanEmail || !cleanPhone || !password) {
            addToast("Please fill in all fields", "error");
            return;
        }

        if (cleanName.length < 2) {
            addToast("Name must be at least 2 characters", "error");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
            addToast("Please enter a valid email address", "error");
            return;
        }

        if (!/^03\d{9}$/.test(cleanPhone)) {
            addToast(
                "Enter a valid 11-digit Pakistani phone number",
                "error"
            );
            return;
        }

        if (password.length < 10) {
            addToast(
                "Password must be at least 10 characters",
                "error"
            );
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

        setLoading(true);

        try {
            await registerUser({
                name: cleanName,
                email: cleanEmail,
                phoneNo: cleanPhone,
                password,
            });

            addToast(
                "Registration successful! Please login.",
                "success"
            );

            router.push("/login");
        } catch (error) {
            console.error(
                "Registration error:",
                error.response?.data || error
            );

            const validationError =
                error.response?.data?.errors?.[0]?.msg ||
                error.response?.data?.errors?.[0]?.message;

            const message =
                validationError ||
                error.response?.data?.message ||
                "Registration failed. Please try again.";

            addToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
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
        );
    }

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
                        marginBottom: "28px",
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
                            fontSize: "32px",
                            marginBottom: "16px",
                            boxShadow:
                                "0 8px 32px rgba(16, 185, 129, 0.3)",
                        }}
                    >
                        🥛
                    </div>

                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "800",
                            color: "#f1f5f9",
                        }}
                    >
                        Create Account
                    </h1>

                    <p
                        style={{
                            fontSize: "14px",
                            color: "#94a3b8",
                            marginTop: "8px",
                        }}
                    >
                        Get started with DairyTech
                    </p>
                </div>

                <div
                    className="glass-card"
                    style={{ padding: "28px" }}
                >
                    <form onSubmit={handleSubmit}>
                        {/* Full name */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                className="input-label"
                                htmlFor="name"
                            >
                                Full Name
                            </label>

                            <div style={{ position: "relative" }}>
                                <User
                                    size={18}
                                    style={iconStyle}
                                />

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="input-field"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    autoComplete="name"
                                    minLength={2}
                                    maxLength={80}
                                    required
                                    disabled={loading}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                className="input-label"
                                htmlFor="email"
                            >
                                Email Address
                            </label>

                            <div style={{ position: "relative" }}>
                                <Mail
                                    size={18}
                                    style={iconStyle}
                                />

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="input-field"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    autoComplete="email"
                                    maxLength={254}
                                    required
                                    disabled={loading}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>
                        </div>

                        {/* Phone number */}
                        <div style={{ marginBottom: "18px" }}>
                            <label
                                className="input-label"
                                htmlFor="phoneNo"
                            >
                                Phone Number
                            </label>

                            <div style={{ position: "relative" }}>
                                <Phone
                                    size={18}
                                    style={iconStyle}
                                />

                                <input
                                    id="phoneNo"
                                    name="phoneNo"
                                    type="tel"
                                    inputMode="numeric"
                                    className="input-field"
                                    placeholder="03XXXXXXXXX"
                                    value={phoneNo}
                                    onChange={(e) =>
                                        setPhoneNo(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 11)
                                        )
                                    }
                                    autoComplete="tel"
                                    pattern="03[0-9]{9}"
                                    minLength={11}
                                    maxLength={11}
                                    required
                                    disabled={loading}
                                    style={{ paddingLeft: "42px" }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: "26px" }}>
                            <label
                                className="input-label"
                                htmlFor="password"
                            >
                                Password
                            </label>

                            <div style={{ position: "relative" }}>
                                <Lock
                                    size={18}
                                    style={iconStyle}
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="input-field"
                                    placeholder="Minimum 10 characters"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
                                    minLength={10}
                                    maxLength={128}
                                    required
                                    disabled={loading}
                                    style={{
                                        paddingLeft: "42px",
                                        paddingRight: "46px",
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) => !current
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    style={{
                                        position: "absolute",
                                        right: "14px",
                                        top: "50%",
                                        transform:
                                            "translateY(-50%)",
                                        display: "flex",
                                        background: "none",
                                        border: "none",
                                        padding: "4px",
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

                            <p
                                style={{
                                    marginTop: "7px",
                                    fontSize: "12px",
                                    lineHeight: "1.5",
                                    color: "#94a3b8",
                                }}
                            >
                                Use uppercase, lowercase, a number,
                                and a special character.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                width: "100%",
                                minHeight: "48px",
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
                                    Create Account
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
                            color: "#94a3b8",
                        }}
                    >
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            style={{
                                color: "#10b981",
                                textDecoration: "none",
                                fontWeight: "600",
                            }}
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const iconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    pointerEvents: "none",
};