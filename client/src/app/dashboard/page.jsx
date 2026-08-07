"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { getCustomers } from "@/src/services/customerService";
import { getAllMilk } from "@/src/services/milkService";
import { getLatestPrice } from "@/src/services/priceService";
import StatsCard from "@/src/components/StatsCard";
import {
  Users,
  Milk,
  Banknote,
  ClipboardCheck,
  UserPlus,
  PlusCircle,
  ArrowRight,
  CalendarDays,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { getLocalDateString } from "@/src/utils/date";

function capitalizeName(name) {
  if (!name || typeof name !== "string") return "User";

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getArrayFromResponse(response) {
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

function formatRecordDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    customers: 0,
    todayMilk: 0,
    todayAmount: 0,
    totalRecords: 0,
    currentPrice: 0,
  });

  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const displayName = useMemo(
    () => capitalizeName(user?.name),
    [user?.name]
  );

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setLoadError("");

      const today = getLocalDateString();

      const [customersResult, milkResult, priceResult] =
        await Promise.allSettled([
          getCustomers(),
          getAllMilk(today),
          getLatestPrice(),
        ]);

      const customers =
        customersResult.status === "fulfilled"
          ? getArrayFromResponse(customersResult.value)
          : [];

      const milkRecords =
        milkResult.status === "fulfilled"
          ? getArrayFromResponse(milkResult.value)
          : [];

      const currentPrice =
        priceResult.status === "fulfilled"
          ? Number(
              priceResult.value?.pricePerLiter ??
                priceResult.value?.data?.pricePerLiter ??
                priceResult.value?.data?.data?.pricePerLiter ??
                0
            )
          : 0;

      const todayMilk = milkRecords.reduce(
        (sum, record) => sum + Number(record?.totalQty || 0),
        0
      );

      const todayAmount = milkRecords.reduce(
        (sum, record) => sum + Number(record?.totalAmount || 0),
        0
      );

      setStats({
        customers: customers.length,
        todayMilk,
        todayAmount,
        totalRecords: milkRecords.length,
        currentPrice,
      });

      setRecentRecords(milkRecords.slice(0, 5));

      if (
        customersResult.status === "rejected" ||
        milkResult.status === "rejected" ||
        priceResult.status === "rejected"
      ) {
        setLoadError(
          "Some dashboard information could not be loaded. You can refresh to try again."
        );
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      setLoadError(
        "We could not load the dashboard. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="dashboard-page" aria-busy="true">
        <div className="skeleton skeleton-heading" />

        <div className="stats-grid">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton skeleton-stat" />
          ))}
        </div>

        <div className="skeleton dashboard-content-skeleton" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">
            <CalendarDays size={16} aria-hidden="true" />
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>

          <h1>
            {getGreeting()}, {displayName}
          </h1>

          <p>
            Here is today&apos;s overview of customers, milk deliveries, and
            sales.
          </p>
        </div>

        <div className="hero-actions">
          <Link href="/dashboard/customers" className="btn-secondary">
            <UserPlus size={20} aria-hidden="true" />
            <span>Add customer</span>
          </Link>

          <Link href="/dashboard/milk" className="btn-primary">
            <PlusCircle size={20} aria-hidden="true" />
            <span>Add milk record</span>
          </Link>
        </div>
      </section>

      {loadError && (
        <div className="dashboard-alert" role="alert">
          <div>
            <strong>Some data is unavailable</strong>
            <p>{loadError}</p>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={() => loadDashboard({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "spin-icon" : ""}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}

      <section className="stats-grid" aria-label="Today dashboard summary">
        <StatsCard
          title="Customers"
          value={stats.customers}
          icon={<Users size={23} />}
          gradient="linear-gradient(135deg,#2563eb,#4f46e5)"
          note="Total active customers"
          delay={0}
        />

        <StatsCard
          title="Milk delivered"
          value={`${stats.todayMilk.toFixed(1)} L`}
          icon={<Milk size={23} />}
          gradient="linear-gradient(135deg,#0f766e,#10b981)"
          note="Morning and evening total"
          delay={1}
        />

        <StatsCard
          title="Today's sales"
          value={`Rs ${formatCurrency(stats.todayAmount)}`}
          icon={<Banknote size={23} />}
          gradient="linear-gradient(135deg,#d97706,#f59e0b)"
          note={`Current rate: Rs ${formatCurrency(stats.currentPrice)}/L`}
          delay={2}
        />

        <StatsCard
          title="Delivery records"
          value={stats.totalRecords}
          icon={<ClipboardCheck size={23} />}
          gradient="linear-gradient(135deg,#7c3aed,#a855f7)"
          note="Records created today"
          delay={3}
        />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              <TrendingUp size={14} aria-hidden="true" />
              Today&apos;s activity
            </span>

            <h2>Recent milk records</h2>

            <p>
              Review the latest customer deliveries and today&apos;s billed
              amounts.
            </p>
          </div>

          <Link href="/dashboard/milk" className="text-link">
            <span>View all records</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Milk size={31} aria-hidden="true" />
            </span>

            <h3>No milk records today</h3>

            <p>
              Add the first milk delivery to begin tracking today&apos;s
              activity.
            </p>

            <Link href="/dashboard/milk" className="btn-primary empty-action">
              <PlusCircle size={19} aria-hidden="true" />
              Add milk record
            </Link>
          </div>
        ) : (
          <>
            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total milk</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {recentRecords.map((record, index) => {
                    const recordKey =
                      record?._id ||
                      `${record?.customerId || "record"}-${
                        record?.date || "date"
                      }-${index}`;

                    return (
                      <tr key={recordKey}>
                        <td>
                          <strong>
                            {record?.customer?.name ||
                              record?.customerId ||
                              "Unknown customer"}
                          </strong>
                        </td>

                        <td>{formatRecordDate(record?.date)}</td>

                        <td>
                          {Number(record?.morning?.deliveredQty || 0).toFixed(1)} L
                          <span className="table-status">
                            {record?.morning?.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          {Number(record?.evening?.deliveredQty || 0).toFixed(1)} L
                          <span className="table-status">
                            {record?.evening?.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {Number(record?.totalQty || 0).toFixed(1)} L
                          </strong>
                        </td>

                        <td className="amount-cell">
                          Rs {formatCurrency(record?.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-record-list">
              {recentRecords.map((record, index) => {
                const recordKey =
                  record?._id ||
                  `${record?.customerId || "record"}-${
                    record?.date || "date"
                  }-${index}`;

                return (
                  <article className="mobile-record-card" key={recordKey}>
                    <div className="record-card-head">
                      <div>
                        <strong>
                          {record?.customer?.name ||
                            record?.customerId ||
                            "Unknown customer"}
                        </strong>

                        <span>{formatRecordDate(record?.date)}</span>
                      </div>

                      <b>Rs {formatCurrency(record?.totalAmount)}</b>
                    </div>

                    <div className="record-metrics">
                      <span>
                        <small>Morning</small>
                        {Number(record?.morning?.deliveredQty || 0).toFixed(1)} L
                      </span>

                      <span>
                        <small>Evening</small>
                        {Number(record?.evening?.deliveredQty || 0).toFixed(1)} L
                      </span>

                      <span>
                        <small>Total</small>
                        {Number(record?.totalQty || 0).toFixed(1)} L
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}