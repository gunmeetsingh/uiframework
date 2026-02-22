"use client";
import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

interface AuthContextType {
    isAuthenticated: boolean;
    login: (values?: any) => void;
    logout: () => void;
    user: { name: string; email: string; role: string; permissions: string[] } | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();

    const isAuthenticated = status === "authenticated";
    const loading = status === "loading";

    const user = session?.user ? {
        name: session.user.name || "",
        email: session.user.email || "",
        role: (session.user as any).role || "viewer",
        permissions: (session.user as any).permissions || []
    } : null;

    const login = (values?: any) => {
        if (values) {
            signIn("credentials", {
                username: values.username,
                password: values.password,
                redirect: true,
                callbackUrl: "/dashboard"
            });
        } else {
            signIn();
        }
    };

    const logout = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
