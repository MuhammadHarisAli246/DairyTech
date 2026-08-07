"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "@/src/services/api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore authentication from the HttpOnly cookie
    const checkAuth = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");

            setUser(response.data?.user || null);
        } catch (error) {
            setUser(null);

            // Only log unexpected errors
            if (error.response?.status !== 401) {
                console.error(
                    "Authentication check failed:",
                    error.response?.data || error
                );
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Login API already creates the HttpOnly cookie.
    // This only updates React's user state.
    const login = useCallback((userData) => {
        if (!userData) {
            console.error("login() did not receive user data");
            return false;
        }

        setUser(userData);
        return true;
    }, []);

    const logOut = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error(
                "Logout request failed:",
                error.response?.data || error
            );
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            logOut,
            checkAuth,
            isAuthenticated: Boolean(user),
        }),
        [user, loading, login, logOut, checkAuth]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error(
            "useAuth() must be used inside <AuthProvider>."
        );
    }

    return context;
};