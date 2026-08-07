"use client";

import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event) => {
            if (event.key === "Escape") onClose();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        window.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                    }}
                >
                    <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--ink, #f1f5f9)" }}>
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close-button"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
