"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { getLatestPrice, setPrice } from "@/src/services/priceService";
import { useToast } from "@/src/components/Toast";
import { getLocalDateString } from "@/src/utils/date";

function normalizePriceResponse(response) {
  if (response?.data?.pricePerLiter !== undefined) return response.data;
  return response || null;
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

export default function PricePage() {
  const { addToast } = useToast();

  const [currentPrice, setCurrentPrice] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(getLocalDateString());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPrice = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) { setRefreshing(true); } else { setLoading(true); }
      const response = await getLatestPrice();
      setCurrentPrice(normalizePriceResponse(response));
    } catch (error) {
      console.error("Price load error:", error);
      setCurrentPrice(null);
      addToast(
        error?.response?.data?.message || "Failed to load current price",
        "error"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPrice();
  }, [loadPrice]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const price = Number(newPrice);

    if (!Number.isFinite(price) || price < 1) {
      addToast("Enter a valid price greater than 0", "error");
      return;
    }

    if (!effectiveFrom) {
      addToast("Select an effective date", "error");
      return;
    }

    try {
      setSaving(true);

      await setPrice({
        pricePerLiter: price,
        effectiveFrom,
        isActive: true,
      });

      addToast("Price updated successfully", "success");
      setNewPrice("");
      await loadPrice({ silent: true });
    } catch (error) {
      console.error("Price save error:", error);
      addToast(
        error?.response?.data?.message || "Failed to update price",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pricing-page" aria-busy="true">
        <div className="skeleton pricing-heading-skeleton" />
        <div className="pricing-layout">
          <div className="skeleton pricing-card-skeleton" />
          <div className="skeleton pricing-card-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <header className="pricing-heading">
        <div>
          <span className="pricing-kicker">
            <TrendingUp size={15} />
            Rate management
          </span>
          <h1>Pricing</h1>
          <p>Set the milk price used for customer billing.</p>
        </div>

        <button
          type="button"
          className="pricing-refresh-button"
          onClick={() => loadPrice({ silent: true })}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "pricing-spin" : ""}
          />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </header>

      <div className="pricing-layout">
        <section className="current-price-card">
          <span className="current-price-icon">
            <CircleDollarSign size={28} />
          </span>

          <small>Current active price</small>

          <h2>
            <span>Rs</span>
            {currentPrice?.pricePerLiter ?? "—"}
          </h2>

          <p>per litre</p>

          <div className="current-price-date">
            <CalendarDays size={16} />
            <span>
              Effective from{" "}
              <strong>{formatDate(currentPrice?.effectiveFrom)}</strong>
            </span>
          </div>
        </section>

        <section className="pricing-form-card">
          <div className="pricing-form-heading">
            <span>
              <TrendingUp size={19} />
            </span>
            <div>
              <h2>Update price</h2>
              <p>The new rate will apply from the selected date.</p>
            </div>
          </div>

          <form className="pricing-form" onSubmit={handleSubmit}>
            <label>
              <span>New price per litre</span>
              <div className="pricing-price-input">
                <strong>Rs</strong>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="220"
                  value={newPrice}
                  onChange={(event) => setNewPrice(event.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              <span>Effective from</span>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              className="pricing-submit-button"
              disabled={saving}
            >
              <Check size={18} />
              {saving ? "Updating..." : "Update price"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}