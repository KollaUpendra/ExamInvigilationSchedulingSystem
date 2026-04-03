/**
 * @file src/context/AuthContext.jsx
 * Global auth state — stores the Google user profile after login.
 * Any component can call useAuth() to get { user, login, logout }.
 */

import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        /* Persist login across page refreshes */
        try {
            const stored = sessionStorage.getItem('examsched_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = useCallback((profile) => {
        setUser(profile);
        sessionStorage.setItem('examsched_user', JSON.stringify(profile));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem('examsched_user');
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
