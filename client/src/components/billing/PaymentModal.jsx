"use client";

import { useState } from "react";
import Modal from "@/src/components/Modal";

export default function PaymentModal({
    receipt,
    isOpen,
    onClose,
    onSubmit,
    saving,
}) {
    const [form, setForm] = useState({
        amount: "",
        method: "cash",
        note: "",
    });

    if (!receipt) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            customerId: receipt.customerId,
            receiptId: receipt._id,
            month: receipt.month,
            amount: Number(form.amount),
            method: form.method,
            note: form.note,
        });

        setForm({
            amount: "",
            method: "cash",
            note: "",
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Record Payment">
            <form onSubmit={handleSubmit}>
                <p style={{ color: "#94a3b8", marginBottom: 16 }}>
                    Customer: <strong>{receipt.customer?.name}</strong>
                    <br />
                    Remaining: <strong>Rs {receipt.remainingBalance}</strong>
                </p>

                <div style={{ marginBottom: 16 }}>
                    <label className="input-label">Amount</label>
                    <input
                        type="number"
                        min="1"
                        className="input-field"
                        value={form.amount}
                        onChange={(e) =>
                            setForm({ ...form, amount: e.target.value })
                        }
                        required
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label className="input-label">Method</label>
                    <select
                        className="select-field"
                        value={form.method}
                        onChange={(e) =>
                            setForm({ ...form, method: e.target.value })
                        }
                    >
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="check">Check</option>
                    </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label className="input-label">Note</label>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Optional note"
                        value={form.note}
                        onChange={(e) =>
                            setForm({ ...form, note: e.target.value })
                        }
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>

                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save Payment"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}