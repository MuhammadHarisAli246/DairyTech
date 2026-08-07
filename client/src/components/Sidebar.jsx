"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Milk,
  CreditCard,
  Receipt,
  BadgeDollarSign,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", shortLabel: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", shortLabel: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Milk Records", shortLabel: "Milk", href: "/dashboard/milk", icon: Milk },
  { label: "Payments", shortLabel: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Receipts", shortLabel: "Receipts", href: "/dashboard/receipts", icon: Receipt },
  { label: "Pricing", shortLabel: "Pricing", href: "/dashboard/price", icon: BadgeDollarSign },
];

const mobilePrimaryItems = navItems.slice(0, 4);

function isRouteActive(pathname, href) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const displayName = user?.name?.trim() || "User";
  const displayRole = user?.role || "Administrator";

  const displayInitial = useMemo(
    () => displayName.charAt(0).toUpperCase(),
    [displayName]
  );

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await Promise.resolve(logOut());
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="mobile-topbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <Link href="/dashboard" className="mobile-brand" aria-label="DairyTech dashboard">
          <span className="brand-mark">
            <Milk size={19} aria-hidden="true" />
          </span>
          <span>DairyTech</span>
        </Link>

        <button
          type="button"
          className="mobile-avatar"
          onClick={() => setMobileOpen(true)}
          aria-label={`Open ${displayName} profile menu`}
        >
          {displayInitial}
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="app-sidebar"
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <Link href="/dashboard" className="brand-link" onClick={closeMobile}>
            <span className="brand-mark brand-mark-lg">
              <Milk size={24} aria-hidden="true" />
            </span>

            <span>
              <strong>DairyTech</strong>
              <small>Milk management</small>
            </span>
          </Link>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-label">Workspace</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={closeMobile}
              >
                <span className="nav-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>

                <span>{item.label}</span>

                <ChevronRight
                  className="nav-arrow"
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar" aria-hidden="true">
              {displayInitial}
            </div>

            <div className="profile-copy">
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={18} aria-hidden="true" />
            <span>{loggingOut ? "Logging out..." : "Log out"}</span>
          </button>
        </div>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobilePrimaryItems.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={closeMobile}
            >
              <span className="mobile-bottom-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`mobile-bottom-link ${
            pathname.startsWith("/dashboard/receipts") ||
            pathname.startsWith("/dashboard/price")
              ? "active"
              : ""
          }`}
          onClick={() => setMobileOpen(true)}
          aria-label="Open more navigation options"
        >
          <span className="mobile-bottom-icon">
            <MoreHorizontal size={21} aria-hidden="true" />
          </span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}