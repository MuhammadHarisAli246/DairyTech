"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Milk,
  RefreshCw,
  Search,
  Sunrise,
  Sunset,
} from "lucide-react";
import {
  getAllMilk,
  updateEveningMilk,
  updateMorningMilk,
} from "@/src/services/milkService";
import { useToast } from "@/src/components/Toast";
import { getLocalDateString } from "@/src/utils/date";

function getRecordsFromResponse(response) {
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

function formatQuantity(value) {
  return `${Number(value || 0).toFixed(1)} L`;
}

function getStatusLabel(status) {
  if (status === "delivered") return "Delivered";
  if (status === "not_delivered") return "Not delivered";
  return "Pending";
}

function getStatusClass(status) {
  if (status === "delivered") return "success";
  if (status === "not_delivered") return "danger";
  return "warning";
}

export default function MilkPage() {
  const { addToast } = useToast();
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState("");
  const [editedRecords, setEditedRecords] = useState({});
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const loadMilkRecords = useCallback(async (date, { silent = false } = {}) => {
    try {
      if (silent) { setRefreshing(true); } else { setLoading(true); }
      setLoadError("");
      const response = await getAllMilk(date);
      setRecords(getRecordsFromResponse(response));
    } catch (error) {
      console.error("Load milk records error:", error);
      setRecords([]);
      setLoadError(
        error.response?.data?.message ||
          "Milk records could not be loaded. Check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMilkRecords(selectedDate);
  }, [loadMilkRecords, selectedDate]);

  const getEditedValue = (recordId, session, field, fallback) =>
    editedRecords?.[recordId]?.[session]?.[field] ?? fallback;

  const updateEditedRecord = (recordId, session, field, value) => {
    setEditedRecords((previous) => ({
      ...previous,
      [recordId]: {
        ...previous[recordId],
        [session]: {
          ...previous[recordId]?.[session],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveRecord = async (record) => {
    if (!record?._id || savingId) return;

    try {
      setSavingId(record._id);

      const morningExtra = Number(
        getEditedValue(record._id, "morning", "extraQty", record.morning?.extraQty || 0)
      );
      const eveningExtra = Number(
        getEditedValue(record._id, "evening", "extraQty", record.evening?.extraQty || 0)
      );

      if (
        !Number.isFinite(morningExtra) ||
        morningExtra < 0 ||
        !Number.isFinite(eveningExtra) ||
        eveningExtra < 0
      ) {
        addToast("Extra quantity must be 0 or greater", "error");
        return;
      }

      await Promise.all([
        updateMorningMilk(record._id, {
          extraQty: morningExtra,
          status: getEditedValue(
            record._id,
            "morning",
            "status",
            record.morning?.status || "pending"
          ),
        }),
        updateEveningMilk(record._id, {
          extraQty: eveningExtra,
          status: getEditedValue(
            record._id,
            "evening",
            "status",
            record.evening?.status || "pending"
          ),
        }),
      ]);

      setEditedRecords((previous) => {
        const updated = { ...previous };
        delete updated[record._id];
        return updated;
      });

      addToast("Milk record updated successfully", "success");
      await loadMilkRecords(selectedDate, { silent: true });
    } catch (error) {
      console.error("Save milk record error:", error);
      addToast(
        error.response?.data?.message || "Failed to update milk record",
        "error"
      );
    } finally {
      setSavingId("");
    }
  };

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) => {
      const values = [
        record?.customer?.name,
        record?.customer?.phone,
        record?.customerId,
      ];
      return values.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [records, searchTerm]);

  const dailySummary = useMemo(
    () =>
      records.reduce(
        (summary, record) => {
          summary.totalQty += Number(record?.totalQty || 0);
          summary.totalAmount += Number(record?.totalAmount || 0);
          if (record?.morning?.status === "delivered") summary.morningDelivered += 1;
          if (record?.evening?.status === "delivered") summary.eveningDelivered += 1;
          return summary;
        },
        { totalQty: 0, totalAmount: 0, morningDelivered: 0, eveningDelivered: 0 }
      ),
    [records]
  );

  if (loading) {
    return (
      <div className="milk-page" aria-busy="true">
        <div className="skeleton milk-heading-skeleton" />
        <div className="milk-summary-grid">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton milk-summary-skeleton" />
          ))}
        </div>
        <div className="skeleton milk-toolbar-skeleton" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton milk-record-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="milk-page">
      <header className="milk-page-heading">
        <div>
          <span className="milk-page-kicker">
            <Milk size={15} /> Daily operations
          </span>
          <h1>Milk records</h1>
          <p>Morning and evening records are generated automatically.</p>
        </div>

        <button
          type="button"
          className="milk-refresh-button"
          onClick={() => loadMilkRecords(selectedDate, { silent: true })}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? "milk-spin" : ""} />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </header>

      {loadError && (
        <div className="milk-alert" role="alert">
          <div>
            <strong>Unable to load records</strong>
            <p>{loadError}</p>
          </div>
          <button type="button" onClick={() => loadMilkRecords(selectedDate)}>
            Try again
          </button>
        </div>
      )}

      <section className="milk-summary-grid">
        {[
          [Milk, "green", "Total milk", formatQuantity(dailySummary.totalQty)],
          [IndianRupee, "blue", "Total amount", `Rs ${formatCurrency(dailySummary.totalAmount)}`],
          [Sunrise, "sky", "Morning done", `${dailySummary.morningDelivered}/${records.length}`],
          [Sunset, "amber", "Evening done", `${dailySummary.eveningDelivered}/${records.length}`],
        ].map(([Icon, tone, label, value]) => (
          <article className="milk-summary-card" key={label}>
            <span className={`milk-summary-icon milk-summary-icon-${tone}`}>
              <Icon size={20} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="milk-toolbar">
        <label className="milk-toolbar-field">
          <CalendarDays size={18} />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>

        <label className="milk-toolbar-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search customer or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <span className="milk-result-count">
          {filteredRecords.length} customer{filteredRecords.length === 1 ? "" : "s"}
        </span>
      </section>

      {filteredRecords.length === 0 ? (
        <section className="milk-empty-state">
          <span><Milk size={30} /></span>
          <h2>No milk records found</h2>
          <p>Records are generated automatically when the backend starts and at the scheduled daily generation time.</p>
        </section>
      ) : (
        <section className="milk-records-list">
          {filteredRecords.map((record) => {
            const recordId = record._id;
            const customerName = record?.customer?.name || record?.customerId || "Unknown customer";
            const isSaving = savingId === recordId;
            const hasChanges = Boolean(editedRecords[recordId]);

            return (
              <article className="milk-record-card" key={recordId}>
                <div className="milk-record-header">
                  <div className="milk-customer-copy">
                    <span className="milk-customer-avatar">{customerName.charAt(0).toUpperCase()}</span>
                    <div>
                      <h2>{customerName}</h2>
                      <p>{record?.customer?.phone || "No phone number"}</p>
                    </div>
                  </div>

                  <div className="milk-record-total">
                    <small>Daily total</small>
                    <strong>{formatQuantity(record?.totalQty)}</strong>
                    <span>Rs {formatCurrency(record?.totalAmount)}</span>
                  </div>
                </div>

                <div className="milk-session-grid">
                  {[
                    { key: "morning", title: "Morning", icon: Sunrise },
                    { key: "evening", title: "Evening", icon: Sunset },
                  ].map(({ key, title, icon: SessionIcon }) => {
                    const session = record?.[key] || {};
                    const status = getEditedValue(recordId, key, "status", session.status || "pending");

                    return (
                      <section className={`milk-session milk-session-${key}`} key={key}>
                        <div className="milk-session-heading">
                          <div>
                            <span className="milk-session-icon"><SessionIcon size={17} /></span>
                            <h3>{title}</h3>
                          </div>
                          <span className={`status-chip ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="milk-session-metrics">
                          <span><small>Base</small><strong>{formatQuantity(session.baseQty)}</strong></span>
                          <span><small>Delivered</small><strong>{formatQuantity(session.deliveredQty)}</strong></span>
                          <span><small>Amount</small><strong>Rs {formatCurrency(session.amount)}</strong></span>
                        </div>

                        <div className="milk-session-controls">
                          <label>
                            <span>Extra milk</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              inputMode="decimal"
                              value={getEditedValue(recordId, key, "extraQty", session.extraQty || 0)}
                              onChange={(event) => updateEditedRecord(recordId, key, "extraQty", event.target.value)}
                            />
                          </label>

                          <label>
                            <span>Status</span>
                            <select
                              value={status}
                              onChange={(event) => updateEditedRecord(recordId, key, "status", event.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="delivered">Delivered</option>
                              <option value="not_delivered">Not delivered</option>
                            </select>
                          </label>
                        </div>
                      </section>
                    );
                  })}
                </div>

                <div className="milk-record-footer">
                  <span className={hasChanges ? "milk-unsaved visible" : "milk-unsaved"}>
                    <CheckCircle2 size={15} />
                    {hasChanges ? "Unsaved changes" : "Record up to date"}
                  </span>

                  <button
                    type="button"
                    className="milk-save-button"
                    onClick={() => handleSaveRecord(record)}
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? "Saving..." : "Save record"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}