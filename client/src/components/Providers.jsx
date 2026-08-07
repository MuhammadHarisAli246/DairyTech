"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import { ToastProvider } from "@/src/components/Toast";

/**
 * Providers — client-side context wrapper for the entire app.
 *
 * Next.js App Router pattern: the root layout.js stays as a server component,
 * and this single "use client" component composes all context providers.
 * This avoids marking the entire layout as a client component.
 */
export default function Providers({ children }) {
    return (
        <AuthProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </AuthProvider>
    );
}
