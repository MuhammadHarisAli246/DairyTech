"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return; // Wait for auth to initialize
        if (user) {
            router.replace("/dashboard");
        } else {
            router.replace("/login");
        }
    }, [user, loading, router]);

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
