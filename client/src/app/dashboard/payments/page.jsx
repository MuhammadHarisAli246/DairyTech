"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Info,
  Landmark,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { getCustomers } from "@/src/services/customerService";
import {
  addPayment,
  deletePayment,
  getPaymentsByCustomer,
} from "@/src/services/paymentService";
import { getReceiptsByCustomer } from "@/src/services/receiptService";
import { useToast } from "@/src/components/Toast";
import Modal from "@/src/components/Modal";

const EMPTY_FORM = {
  customerId: "",
  amount: "",
  method: "cash",
  month: "",
  note: "",
};

function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getMethodIcon(method) {
  if (method === "online") return Landmark;
  if (method === "check") return ReceiptText;
  return Banknote;
}

function getMethodClass(method) {
  if (method === "online") return "online";
  if (method === "check") return "check";
  return "cash";
}

export default function PaymentsPage() {
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modalBill, setModalBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const billAbortRef = useRef(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const response = await getCustomers();
      setCustomers(getArray(response));
    } catch (error) {
      console.error("Load customers error:", error);
      setCustomers([]);
      addToast("Failed to load customers", "error");
    } finally {
      setLoadingCustomers(false);
    }
  }, [addToast]);

  const loadPayments = useCallback(
    async (customerId) => {
      if (!customerId) {
        setPayments([]);
        return;
      }

      try {
        setLoadingPayments(true);
        const response = await getPaymentsByCustomer(customerId);
        setPayments(getArray(response));
      } catch (error) {
        console.error("Load payments error:", error);
        setPayments([]);
        addToast("Failed to load payments", "error");
      } finally {
        setLoadingPayments(false);
      }
    },
    [addToast]
  );

  const fetchModalBill = useCallback(
    async (customerId) => {
      if (!customerId) {
        setModalBill(null);
        return;
      }

      if (billAbortRef.current) {
        clearTimeout(billAbortRef.current);
      }

      setLoadingBill(true);
      setModalBill(null);

      try {
        const response = await getReceiptsByCustomer(customerId);
        const receipts = getArray(response);
        const latest = receipts.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )[0];
        setModalBill(latest || null);
      } catch {
        setModalBill(null);
      } finally {
        setLoadingBill(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    loadPayments(selectedCustomer);
  }, [loadPayments, selectedCustomer]);

  const selectedCustomerData = useMemo(
    () => customers.find((customer) => customer._id === selectedCustomer),
    [customers, selectedCustomer]
  );

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return payments;

    return payments.filter((payment) =>
      [payment.method, payment.month, payment.note, payment.amount]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [payments, searchTerm]);

  const paymentSummary = useMemo(() => {
    const total = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const latestPayment = [...payments].sort(
      (a, b) =>
        new Date(b.paymentDate || b.createdAt || 0) -
        new Date(a.paymentDate || a.createdAt || 0)
    )[0];

    const methods = new Set(
      payments.map((payment) => payment.method).filter(Boolean)
    );

    return {
      total,
      count: payments.length,
      latestPayment,
      methods: methods.size,
    };
  }, [payments]);

  const openAddModal = () => {
    const customerId = selectedCustomer || "";
    setForm({
      ...EMPTY_FORM,
      customerId,
      month: getCurrentMonthLabel(),
    });
    setModalOpen(true);
    if (customerId) fetchModalBill(customerId);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setModalBill(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.customerId || !form.month.trim()) {
      addToast("Customer, amount and month are required", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      addToast("Enter a valid payment amount", "error");
      return;
    }

    try {
      setSubmitting(true);

      await addPayment({
        customerId: form.customerId,
        amount,
        method: form.method,
        month: form.month.trim(),
        note: form.note.trim(),
      });

      addToast("Payment recorded successfully", "success");
      setModalOpen(false);
      setForm(EMPTY_FORM);

      if (selectedCustomer === form.customerId) {
        await loadPayments(selectedCustomer);
      } else {
        setSelectedCustomer(form.customerId);
      }
    } catch (error) {
      console.error("Add payment error:", error);
      addToast(
        error.response?.data?.message || "Failed to add payment",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Delete this payment record?")) return;

    try {
      setDeletingId(paymentId);
      await deletePayment(paymentId);
      addToast("Payment deleted", "success");
      await loadPayments(selectedCustomer);
    } catch (error) {
      console.error("Delete payment error:", error);
      addToast("Failed to delete payment", "error");
    } finally {
      setDeletingId("");
    }
  };

  if (loadingCustomers) {
    return (
      <div className="payments-page" aria-busy="true">
        <div className="skeleton payments-heading-skeleton" />
        <div className="payments-summary-grid">
          {[1, 2, 3].map((item) => (
            <div className="skeleton payments-summary-skeleton" key={item} />
          ))}
        </div>
        <div className="skeleton payments-toolbar-skeleton" />
        <div className="skeleton payments-records-skeleton" />
      </div>
    );
  }

  return (
    <div className="payments-page">
      <header className="payments-heading">
        <div>
          <span className="payments-kicker">
            <WalletCards size={15} aria-hidden="true" />
            Customer accounts
          </span>

          <h1>Payments</h1>
          <p>Record collections and review each customer&apos;s payment history.</p>
        </div>

        <button
          type="button"
          className="payments-add-button"
          onClick={openAddModal}
          disabled={customers.length === 0}
        >
          <Plus size={18} aria-hidden="true" />
          <span>Add payment</span>
        </button>
      </header>

      <section className="payments-summary-grid" aria-label="Payment summary">
        <article className="payments-summary-card">
          <span className="payments-summary-icon green">
            <Banknote size={20} aria-hidden="true" />
          </span>
          <div>
            <small>Total collected</small>
            <strong>Rs {formatCurrency(paymentSummary.total)}</strong>
          </div>
        </article>

        <article className="payments-summary-card">
          <span className="payments-summary-icon blue">
            <ReceiptText size={20} aria-hidden="true" />
          </span>
          <div>
            <small>Payments</small>
            <strong>{paymentSummary.count}</strong>
          </div>
        </article>

        <article className="payments-summary-card">
          <span className="payments-summary-icon amber">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
          <div>
            <small>Latest payment</small>
            <strong>
              {paymentSummary.latestPayment
                ? formatDate(
                    paymentSummary.latestPayment.paymentDate ||
                      paymentSummary.latestPayment.createdAt
                  )
                : "No payment"}
            </strong>
          </div>
        </article>
      </section>

      <section className="payments-toolbar">
        <label className="payments-filter-field">
          <span>Customer</span>
          <select
            value={selectedCustomer}
            onChange={(event) => {
              setSelectedCustomer(event.target.value);
              setSearchTerm("");
            }}
          >
            <option value="">Choose a customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name} — {customer.phone}
              </option>
            ))}
          </select>
        </label>

        <label className="payments-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search payment history</span>
          <input
            type="search"
            placeholder="Search method, month or note"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={!selectedCustomer}
          />
        </label>
      </section>

      {!selectedCustomer ? (
        <section className="payments-empty-state">
          <span>
            <CreditCard size={30} aria-hidden="true" />
          </span>
          <h2>Select a customer</h2>
          <p>Choose a customer above to review payment history and collections.</p>
        </section>
      ) : loadingPayments ? (
        <div className="payments-history-loading">
          {[1, 2, 3].map((item) => (
            <div className="skeleton payments-payment-skeleton" key={item} />
          ))}
        </div>
      ) : (
        <section className="payments-history-card">
          <div className="payments-history-heading">
            <div>
              <span>Payment history</span>
              <h2>{selectedCustomerData?.name || "Selected customer"}</h2>
              <p>{selectedCustomerData?.phone || "No phone number"}</p>
            </div>

            <strong>
              {filteredPayments.length} record
              {filteredPayments.length === 1 ? "" : "s"}
            </strong>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="payments-inline-empty">
              <CreditCard size={25} aria-hidden="true" />
              <div>
                <strong>No payments found</strong>
                <p>
                  {searchTerm
                    ? "No record matches your search."
                    : "Record the first payment for this customer."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="payments-desktop-table">
                <table>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Month</th>
                      <th>Payment date</th>
                      <th>Note</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map((payment) => {
                      const MethodIcon = getMethodIcon(payment.method);

                      return (
                        <tr key={payment._id}>
                          <td className="payments-amount">
                            Rs {formatCurrency(payment.amount)}
                          </td>

                          <td>
                            <span
                              className={`payment-method ${getMethodClass(
                                payment.method
                              )}`}
                            >
                              <MethodIcon size={14} aria-hidden="true" />
                              {payment.method || "cash"}
                            </span>
                          </td>

                          <td>{payment.month || "Not specified"}</td>

                          <td>
                            {formatDate(
                              payment.paymentDate || payment.createdAt
                            )}
                          </td>

                          <td className="payments-note">
                            {payment.note || "No note"}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="payment-delete-button"
                              onClick={() => handleDelete(payment._id)}
                              disabled={deletingId === payment._id}
                              aria-label="Delete payment"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="payments-mobile-list">
                {filteredPayments.map((payment) => {
                  const MethodIcon = getMethodIcon(payment.method);

                  return (
                    <article className="payment-mobile-card" key={payment._id}>
                      <div className="payment-mobile-head">
                        <div>
                          <small>{payment.month || "Payment"}</small>
                          <strong>Rs {formatCurrency(payment.amount)}</strong>
                        </div>

                        <span
                          className={`payment-method ${getMethodClass(
                            payment.method
                          )}`}
                        >
                          <MethodIcon size={13} aria-hidden="true" />
                          {payment.method || "cash"}
                        </span>
                      </div>

                      <div className="payment-mobile-meta">
                        <span>
                          <small>Date</small>
                          <strong>
                            {formatDate(
                              payment.paymentDate || payment.createdAt
                            )}
                          </strong>
                        </span>

                        <span>
                          <small>Note</small>
                          <strong>{payment.note || "No note"}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="payment-mobile-delete"
                        onClick={() => handleDelete(payment._id)}
                        disabled={deletingId === payment._id}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {deletingId === payment._id
                          ? "Deleting..."
                          : "Delete payment"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        className="payments-fab"
        onClick={openAddModal}
        disabled={customers.length === 0}
        aria-label="Add payment"
      >
        <Plus size={23} aria-hidden="true" />
      </button>

      <Modal isOpen={modalOpen} onClose={closeModal} title="Add payment">
        <form className="payment-form" onSubmit={handleSubmit}>
          <label className="payment-form-field full">
            <span>Customer *</span>
            <select
              value={form.customerId}
              onChange={(event) => {
                const customerId = event.target.value;
                setForm((previous) => ({
                  ...previous,
                  customerId,
                }));
                fetchModalBill(customerId);
              }}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} — {customer.phone}
                </option>
              ))}
            </select>
          </label>

          {form.customerId && (
            <div className="modal-bill-info">
              {loadingBill ? (
                <span className="modal-bill-loading">Loading bill...</span>
              ) : modalBill ? (
                <>
                  <div className="modal-bill-row">
                    <span>Month</span>
                    <strong>{modalBill.month}</strong>
                  </div>
                  <div className="modal-bill-row">
                    <span>Total</span>
                    <strong>Rs {modalBill.totalAmount?.toLocaleString() ?? 0}</strong>
                  </div>
                  <div className="modal-bill-row">
                    <span>Paid</span>
                    <strong>Rs {modalBill.paidAmount?.toLocaleString() ?? 0}</strong>
                  </div>
                  <div className="modal-bill-row modal-bill-remaining">
                    <span>Remaining</span>
                    <strong>Rs {modalBill.remaining?.toLocaleString() ?? 0}</strong>
                  </div>
                </>
              ) : (
                <span className="modal-bill-empty">
                  <Info size={14} aria-hidden="true" />
                  No bill found for this customer
                </span>
              )}
            </div>
          )}

          <label className="payment-form-field">
            <span>Amount (Rs) *</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="5000"
              value={form.amount}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  amount: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="payment-form-field">
            <span>Method *</span>
            <select
              value={form.method}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  method: event.target.value,
                }))
              }
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="check">Check</option>
            </select>
          </label>

          <label className="payment-form-field full">
            <span>Billing month *</span>
            <input
              type="text"
              placeholder="March 2026"
              value={form.month}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  month: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="payment-form-field full">
            <span>Note</span>
            <textarea
              rows="3"
              placeholder="Optional payment details"
              value={form.note}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  note: event.target.value,
                }))
              }
            />
          </label>

          <div className="payment-form-actions">
            <button
              type="button"
              className="payment-cancel-button"
              onClick={closeModal}
              disabled={submitting}
            >
              <X size={17} aria-hidden="true" />
              Cancel
            </button>

            <button
              type="submit"
              className="payment-submit-button"
              disabled={submitting}
            >
              <CreditCard size={17} aria-hidden="true" />
              {submitting ? "Saving..." : "Record payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}