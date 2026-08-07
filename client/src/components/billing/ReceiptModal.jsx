"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/src/components/Modal";
import { getPaymentsByCustomer } from "@/src/services/paymentService";
import {
    MessageCircle,
    Printer,
    Wallet,
    Loader2,
} from "lucide-react";

export default function ReceiptModal({
    receipt,
    isOpen,
    onClose,
    onWhatsApp,
    onPayment,
}) {
    const [payments, setPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    useEffect(() => {
        if (!isOpen || !receipt?.customerId) {
            setPayments([]);
            return;
        }

        const loadPayments = async () => {
            try {
                setLoadingPayments(true);

                const response = await getPaymentsByCustomer(
                    receipt.customerId
                );

                setPayments(
                    Array.isArray(response)
                        ? response
                        : response.data || []
                );
            } catch (error) {
                console.error(
                    "Failed to load payment history:",
                    error
                );

                setPayments([]);
            } finally {
                setLoadingPayments(false);
            }
        };

        loadPayments();
    }, [isOpen, receipt?._id, receipt?.customerId]);

    const receiptPayments = useMemo(() => {
        if (!receipt) return [];

        return payments.filter((payment) => {
            const paymentReceiptId =
                typeof payment.receiptId === "object"
                    ? payment.receiptId?._id
                    : payment.receiptId;

            return (
                paymentReceiptId === receipt._id ||
                payment.month === receipt.month
            );
        });
    }, [payments, receipt]);

    const paymentHistoryTotal = useMemo(() => {
        return receiptPayments.reduce(
            (sum, payment) =>
                sum + Number(payment.amount || 0),
            0
        );
    }, [receiptPayments]);

    const formatMonth = (month) => {
        if (!month) return "N/A";

        const [year, monthNumber] = month.split("-");

        const date = new Date(
            Number(year),
            Number(monthNumber) - 1,
            1
        );

        return date.toLocaleDateString("en-PK", {
            month: "long",
            year: "numeric",
        });
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "N/A";

        return new Date(dateValue).toLocaleDateString(
            "en-PK",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatMoney = (amount) =>
        Number(amount || 0).toLocaleString("en-PK");

    const handlePrint = () => {
        window.print();
    };

    if (!receipt) return null;

    const statusLabel =
        receipt.status?.replaceAll("_", " ") || "unpaid";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Monthly Bill"
        >
            <div
                id="printable-receipt"
                style={{
                    background: "#ffffff",
                    color: "#111827",
                    padding: "36px",
                    borderRadius: "14px",
                    maxWidth: "760px",
                    margin: "0 auto",
                    fontFamily:
                        "Arial, Helvetica, sans-serif",
                    boxShadow:
                        "0 8px 30px rgba(0, 0, 0, 0.12)",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "32px",
                            fontWeight: "800",
                            letterSpacing: "1px",
                            color: "#111827",
                        }}
                    >
                        HARIS DAIRY
                    </h1>

                    <p
                        style={{
                            margin: "8px 0 0",
                            color: "#6b7280",
                            fontSize: "17px",
                        }}
                    >
                        Monthly Milk Invoice
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "20px",
                        flexWrap: "wrap",
                        paddingBottom: "18px",
                        marginBottom: "22px",
                        borderBottom:
                            "2px solid #e5e7eb",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: "0 0 6px",
                                color: "#6b7280",
                                fontSize: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.6px",
                            }}
                        >
                            Bill To
                        </p>

                        <p
                            style={{
                                margin: "0 0 4px",
                                fontWeight: "700",
                                fontSize: "18px",
                                color: "#111827",
                            }}
                        >
                            {receipt.customer?.name ||
                                receipt.customerId}
                        </p>

                        <p
                            style={{
                                margin: 0,
                                color: "#4b5563",
                            }}
                        >
                            {receipt.customer?.phone ||
                                "No phone number"}
                        </p>
                    </div>

                    <div
                        style={{
                            textAlign: "right",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 6px",
                                color: "#6b7280",
                                fontSize: "12px",
                                textTransform: "uppercase",
                                letterSpacing: "0.6px",
                            }}
                        >
                            Billing Month
                        </p>

                        <p
                            style={{
                                margin: "0 0 4px",
                                fontWeight: "700",
                                fontSize: "17px",
                                color: "#111827",
                            }}
                        >
                            {formatMonth(receipt.month)}
                        </p>

                        <p
                            style={{
                                margin: 0,
                                color: "#4b5563",
                                fontSize: "13px",
                            }}
                        >
                            Generated:{" "}
                            {formatDate(
                                receipt.generatedOn ||
                                    receipt.createdAt
                            )}
                        </p>
                    </div>
                </div>

                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "24px",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: "#f3f4f6",
                            }}
                        >
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "12px",
                                    borderBottom:
                                        "1px solid #d1d5db",
                                    color: "#374151",
                                    fontSize: "13px",
                                }}
                            >
                                Description
                            </th>

                            <th
                                style={{
                                    textAlign: "right",
                                    padding: "12px",
                                    borderBottom:
                                        "1px solid #d1d5db",
                                    color: "#374151",
                                    fontSize: "13px",
                                }}
                            >
                                Value
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <InvoiceRow
                            label="Total Milk Supplied"
                            value={`${Number(
                                receipt.totalMilk || 0
                            ).toFixed(1)} L`}
                        />

                        <InvoiceRow
                            label="Total Bill"
                            value={`Rs ${formatMoney(
                                receipt.totalAmount
                            )}`}
                        />

                        <InvoiceRow
                            label="Paid Amount"
                            value={`Rs ${formatMoney(
                                receipt.paidAmount
                            )}`}
                        />

                        <InvoiceRow
                            label="Remaining Balance"
                            value={`Rs ${formatMoney(
                                receipt.remainingBalance
                            )}`}
                            emphasized
                        />
                    </tbody>
                </table>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        marginBottom: "26px",
                    }}
                >
                    <span
                        style={{
                            color: "#4b5563",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >
                        Payment Status
                    </span>

                    <span
                        style={{
                            padding: "7px 12px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            background:
                                receipt.status === "paid"
                                    ? "#dcfce7"
                                    : receipt.status ===
                                        "partially_paid"
                                      ? "#fef3c7"
                                      : "#fee2e2",
                            color:
                                receipt.status === "paid"
                                    ? "#166534"
                                    : receipt.status ===
                                        "partially_paid"
                                      ? "#92400e"
                                      : "#991b1b",
                        }}
                    >
                        {statusLabel}
                    </span>
                </div>

                <div
                    style={{
                        marginBottom: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "17px",
                                color: "#111827",
                            }}
                        >
                            Payment History
                        </h2>

                        <span
                            style={{
                                color: "#4b5563",
                                fontSize: "13px",
                                fontWeight: "600",
                            }}
                        >
                            Total received: Rs{" "}
                            {formatMoney(
                                paymentHistoryTotal
                            )}
                        </span>
                    </div>

                    {loadingPayments ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                                padding: "24px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                color: "#6b7280",
                            }}
                        >
                            <Loader2
                                size={18}
                                className="receipt-loader"
                            />
                            Loading payments...
                        </div>
                    ) : receiptPayments.length === 0 ? (
                        <div
                            style={{
                                padding: "22px",
                                textAlign: "center",
                                border: "1px solid #e5e7eb",
                                borderRadius: "10px",
                                color: "#6b7280",
                                background: "#f9fafb",
                            }}
                        >
                            No payments recorded for this
                            invoice.
                        </div>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border: "1px solid #e5e7eb",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            "#f3f4f6",
                                    }}
                                >
                                    <th
                                        style={paymentHeaderStyle}
                                    >
                                        Date
                                    </th>

                                    <th
                                        style={paymentHeaderStyle}
                                    >
                                        Method
                                    </th>

                                    <th
                                        style={{
                                            ...paymentHeaderStyle,
                                            textAlign: "right",
                                        }}
                                    >
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {receiptPayments.map(
                                    (payment) => (
                                        <tr key={payment._id}>
                                            <td
                                                style={
                                                    paymentCellStyle
                                                }
                                            >
                                                {formatDate(
                                                    payment.paymentDate
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...paymentCellStyle,
                                                    textTransform:
                                                        "capitalize",
                                                }}
                                            >
                                                {payment.method ||
                                                    "cash"}

                                                {payment.note && (
                                                    <div
                                                        style={{
                                                            marginTop:
                                                                "3px",
                                                            color: "#6b7280",
                                                            fontSize:
                                                                "11px",
                                                        }}
                                                    >
                                                        {
                                                            payment.note
                                                        }
                                                    </div>
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...paymentCellStyle,
                                                    textAlign:
                                                        "right",
                                                    fontWeight:
                                                        "700",
                                                }}
                                            >
                                                Rs{" "}
                                                {formatMoney(
                                                    payment.amount
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div
                    style={{
                        textAlign: "center",
                        paddingTop: "20px",
                        borderTop:
                            "2px solid #e5e7eb",
                    }}
                >
                    <p
                        style={{
                            margin: "0 0 7px",
                            color: "#111827",
                            fontWeight: "700",
                        }}
                    >
                        Thank you for your business.
                    </p>

                    <p
                        style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "13px",
                            lineHeight: "1.6",
                        }}
                    >
                        For bill-related queries, contact
                        Haris Dairy.
                        <br />
                        Phone: 0310-1148270
                    </p>
                </div>
            </div>

            <div
                className="receipt-actions"
                style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                    marginTop: "24px",
                }}
            >
                <button
                    className="btn-secondary"
                    onClick={handlePrint}
                >
                    <Printer size={16} />
                    Print / Save PDF
                </button>

                <button
                    className="btn-secondary"
                    onClick={() => onPayment(receipt)}
                    disabled={
                        Number(
                            receipt.remainingBalance || 0
                        ) <= 0
                    }
                >
                    <Wallet size={16} />
                    {Number(
                        receipt.remainingBalance || 0
                    ) <= 0
                        ? "Fully Paid"
                        : "Record Payment"}
                </button>

                <button
                    className="btn-primary"
                    onClick={() =>
                        onWhatsApp(receipt)
                    }
                    disabled={
                        !receipt.customer?.phone
                    }
                >
                    <MessageCircle size={16} />
                    WhatsApp
                </button>
            </div>

            <style jsx global>{`
                .receipt-loader {
                    animation: receipt-spin 0.8s linear
                        infinite;
                }

                @keyframes receipt-spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 12mm;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #printable-receipt,
                    #printable-receipt * {
                        visibility: visible !important;
                    }

                    #printable-receipt {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }

                    .receipt-actions {
                        display: none !important;
                    }
                }
            `}</style>
        </Modal>
    );
}

function InvoiceRow({
    label,
    value,
    emphasized = false,
}) {
    return (
        <tr>
            <td
                style={{
                    padding: "12px",
                    borderBottom:
                        "1px solid #e5e7eb",
                    color: "#374151",
                    fontWeight: emphasized
                        ? "700"
                        : "500",
                }}
            >
                {label}
            </td>

            <td
                style={{
                    padding: "12px",
                    borderBottom:
                        "1px solid #e5e7eb",
                    textAlign: "right",
                    color: emphasized
                        ? "#b45309"
                        : "#111827",
                    fontWeight: "700",
                }}
            >
                {value}
            </td>
        </tr>
    );
}

const paymentHeaderStyle = {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #d1d5db",
    color: "#374151",
    fontSize: "12px",
};

const paymentCellStyle = {
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: "13px",
};