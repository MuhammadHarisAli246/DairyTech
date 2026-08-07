"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  MessageCircle,
  Milk,
  Printer,
  RefreshCw,
  Search,
  Send,
  Wallet,
} from "lucide-react";
import ReceiptModal from "@/src/components/billing/ReceiptModal";
import PaymentModal from "@/src/components/billing/PaymentModal";
import {
  generateAllReceipts,
  getAllReceipts,
} from "@/src/services/receiptService";
import { addPayment } from "@/src/services/paymentService";
import {
  sendAllWhatsApp,
  sendSingleWhatsApp,
} from "@/src/utils/whatsapp";
import { useToast } from "@/src/components/Toast";

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function monthLabel(month) {
  if (!month) return "Unknown month";

  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  if (Number.isNaN(date.getTime())) return month;

  return date.toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status) {
  if (status === "paid") return "Paid";
  if (status === "partially_paid") return "Partially paid";
  return "Unpaid";
}

function statusClass(status) {
  if (status === "paid") return "paid";
  if (status === "partially_paid") return "partial";
  return "unpaid";
}

export default function ReceiptsPage() {
  const { addToast } = useToast();

  const [month, setMonth] = useState(getCurrentMonth());
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const loadReceipts = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) { setRefreshing(true); } else { setLoading(true); }
        const response = await getAllReceipts(month);
        setReceipts(getArray(response));
      } catch (error) {
        console.error("Load receipts error:", error);
        setReceipts([]);
        addToast(
          error.response?.data?.message || "Failed to load receipts",
          "error"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month, addToast]
  );

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const summary = useMemo(
    () =>
      receipts.reduce(
        (result, receipt) => {
          result.totalMilk += Number(receipt.totalMilk || 0);
          result.totalAmount += Number(receipt.totalAmount || 0);
          result.paidAmount += Number(receipt.paidAmount || 0);
          result.remainingBalance += Number(receipt.remainingBalance || 0);

          if (receipt.status === "paid") result.paid += 1;
          else if (receipt.status === "partially_paid") result.partial += 1;
          else result.unpaid += 1;

          return result;
        },
        {
          totalMilk: 0,
          totalAmount: 0,
          paidAmount: 0,
          remainingBalance: 0,
          paid: 0,
          partial: 0,
          unpaid: 0,
        }
      ),
    [receipts]
  );

  const filteredReceipts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return receipts;

    return receipts.filter((receipt) =>
      [
        receipt.customer?.name,
        receipt.customer?.phone,
        receipt.customerId,
        receipt.status?.replaceAll("_", " "),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [receipts, searchTerm]);

  const handleGenerateAll = async () => {
    if (!month || generating) return;

    try {
      setGenerating(true);
      await generateAllReceipts({ month });
      addToast("Bills generated successfully", "success");
      await loadReceipts({ silent: true });
    } catch (error) {
      console.error("Generate receipts error:", error);
      addToast(
        error.response?.data?.message || "Failed to generate bills",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptModalOpen(true);
  };

  const handlePayment = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptModalOpen(false);
    setPaymentModalOpen(true);
  };

  const handlePrint = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptModalOpen(true);
    window.setTimeout(() => window.print(), 350);
  };

  const handleWhatsApp = (receipt) => {
    if (!receipt?.customer?.phone) {
      addToast("This customer has no phone number", "error");
      return;
    }

    sendSingleWhatsApp(receipt);
  };

  const handleSendAll = () => {
    const validReceipts = receipts.filter(
      (receipt) => receipt.customer?.phone
    );

    if (!validReceipts.length) {
      addToast("No customers with phone numbers found", "error");
      return;
    }

    sendAllWhatsApp(validReceipts);
    addToast("Opening WhatsApp messages...", "success");
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      setSavingPayment(true);
      await addPayment(paymentData);
      addToast("Payment recorded successfully", "success");
      setPaymentModalOpen(false);
      setSelectedReceipt(null);
      await loadReceipts({ silent: true });
    } catch (error) {
      console.error("Receipt payment error:", error);
      addToast(
        error.response?.data?.message || "Failed to record payment",
        "error"
      );
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="receipts-page" aria-busy="true">
        <div className="skeleton receipts-heading-skeleton" />
        <div className="receipts-summary-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="skeleton receipts-summary-skeleton" key={item} />
          ))}
        </div>
        <div className="skeleton receipts-toolbar-skeleton" />
        <div className="skeleton receipts-list-skeleton" />
      </div>
    );
  }

  return (
    <div className="receipts-page">
      <header className="receipts-heading">
        <div>
          <span className="receipts-kicker">
            <FileText size={15} aria-hidden="true" />
            Monthly billing
          </span>
          <h1>Receipts</h1>
          <p>Generate, collect and share customer milk bills.</p>
        </div>

        <button
          type="button"
          className="receipts-generate-button"
          onClick={handleGenerateAll}
          disabled={generating}
        >
          <FileText size={17} aria-hidden="true" />
          <span>{generating ? "Generating..." : "Generate bills"}</span>
        </button>
      </header>

      <section className="receipts-summary-grid" aria-label="Billing summary">
        <article className="receipts-summary-card">
          <span className="receipts-summary-icon green">
            <Banknote size={20} />
          </span>
          <div>
            <small>Total billing</small>
            <strong>Rs {money(summary.totalAmount)}</strong>
          </div>
        </article>

        <article className="receipts-summary-card">
          <span className="receipts-summary-icon blue">
            <Wallet size={20} />
          </span>
          <div>
            <small>Collected</small>
            <strong>Rs {money(summary.paidAmount)}</strong>
          </div>
        </article>

        <article className="receipts-summary-card">
          <span className="receipts-summary-icon amber">
            <Banknote size={20} />
          </span>
          <div>
            <small>Outstanding</small>
            <strong>Rs {money(summary.remainingBalance)}</strong>
          </div>
        </article>

        <article className="receipts-summary-card">
          <span className="receipts-summary-icon sky">
            <Milk size={20} />
          </span>
          <div>
            <small>Total milk</small>
            <strong>{summary.totalMilk.toFixed(1)} L</strong>
          </div>
        </article>
      </section>

      <section className="receipts-status-row">
        <span className="receipt-status paid">
          <CheckCircle2 size={14} />
          Paid {summary.paid}
        </span>
        <span className="receipt-status partial">
          Partial {summary.partial}
        </span>
        <span className="receipt-status unpaid">
          Unpaid {summary.unpaid}
        </span>
      </section>

      <section className="receipts-toolbar">
        <label className="receipts-month-field">
          <CalendarDays size={17} />
          <span className="sr-only">Billing month</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>

        <label className="receipts-search-field">
          <Search size={17} />
          <span className="sr-only">Search receipts</span>
          <input
            type="search"
            placeholder="Search customer, phone or status"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="receipts-refresh-button"
          onClick={() => loadReceipts({ silent: true })}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "receipts-spin" : ""}
          />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          className="receipts-send-all-button"
          onClick={handleSendAll}
          disabled={receipts.length === 0}
        >
          <Send size={17} />
          <span>Send all</span>
        </button>
      </section>

      {filteredReceipts.length === 0 ? (
        <section className="receipts-empty-state">
          <span>
            <FileText size={30} />
          </span>
          <h2>No receipts found</h2>
          <p>
            Generate bills for {monthLabel(month)} or change the selected
            month.
          </p>
          <button type="button" className="btn-primary" onClick={handleGenerateAll}>
            Generate bills
          </button>
        </section>
      ) : (
        <>
          <section className="receipts-table-card">
            <div className="receipts-table-heading">
              <div>
                <span>{monthLabel(month)}</span>
                <h2>Customer bills</h2>
              </div>
              <strong>{filteredReceipts.length} receipts</strong>
            </div>

            <div className="receipts-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Milk</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt._id}>
                      <td>
                        <strong>
                          {receipt.customer?.name ||
                            receipt.customerId ||
                            "Unknown customer"}
                        </strong>
                        <span>{receipt.customer?.phone || "No phone"}</span>
                      </td>
                      <td>{Number(receipt.totalMilk || 0).toFixed(1)} L</td>
                      <td className="receipt-total">
                        Rs {money(receipt.totalAmount)}
                      </td>
                      <td>Rs {money(receipt.paidAmount)}</td>
                      <td className="receipt-balance">
                        Rs {money(receipt.remainingBalance)}
                      </td>
                      <td>
                        <span
                          className={`receipt-status ${statusClass(
                            receipt.status
                          )}`}
                        >
                          {statusLabel(receipt.status)}
                        </span>
                      </td>
                        <td>
                        <div className="receipt-row-actions">
                          <button type="button" onClick={() => handleView(receipt)} title="View">
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayment(receipt)}
                            title="Payment"
                          >
                            <Wallet size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWhatsApp(receipt)}
                            title="WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(receipt)}
                            title="Print"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="receipts-mobile-list">
              {filteredReceipts.map((receipt) => (
                <article className="receipt-mobile-card" key={receipt._id}>
                  <div className="receipt-mobile-head">
                    <div>
                      <h3>
                        {receipt.customer?.name ||
                          receipt.customerId ||
                          "Unknown customer"}
                      </h3>
                      <p>{receipt.customer?.phone || "No phone number"}</p>
                    </div>
                    <span
                      className={`receipt-status ${statusClass(receipt.status)}`}
                    >
                      {statusLabel(receipt.status)}
                    </span>
                  </div>

                  <div className="receipt-mobile-metrics">
                    <span>
                      <small>Milk</small>
                      <strong>
                        {Number(receipt.totalMilk || 0).toFixed(1)} L
                      </strong>
                    </span>
                    <span>
                      <small>Total</small>
                      <strong>Rs {money(receipt.totalAmount)}</strong>
                    </span>
                    <span>
                      <small>Balance</small>
                      <strong>Rs {money(receipt.remainingBalance)}</strong>
                    </span>
                  </div>

                  <div className="receipt-mobile-actions">
                    <button type="button" onClick={() => handleView(receipt)}>
                      <Eye size={15} /> View
                    </button>
                    <button type="button" onClick={() => handlePayment(receipt)}>
                      <Wallet size={15} /> Payment
                    </button>
                    <button type="button" onClick={() => handleWhatsApp(receipt)}>
                      <MessageCircle size={15} /> WhatsApp
                    </button>
                    <button type="button" onClick={() => handlePrint(receipt)}>
                      <Printer size={15} /> Print
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        onWhatsApp={handleWhatsApp}
        onPayment={handlePayment}
      />

      <PaymentModal
        receipt={selectedReceipt}
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedReceipt(null);
        }}
        onSubmit={handlePaymentSubmit}
        saving={savingPayment}
      />
    </div>
  );
}