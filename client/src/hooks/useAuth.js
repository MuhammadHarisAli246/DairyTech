/**
 * Re-export useAuth from the canonical AuthContext location.
 * This file exists solely for backward compatibility — all existing
 * imports (`from "@/src/hooks/useAuth"`) continue to work without changes.
 */
export { useAuth } from "@/src/context/AuthContext";