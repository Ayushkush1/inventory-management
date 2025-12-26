import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User, Permission } from '../types';

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (userData: any) => Promise<any>;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    const user = await authAPI.getCurrentUser();
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('current_user');
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authAPI.login(email, password);
            setCurrentUser(response.user);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await authAPI.logout();
        setCurrentUser(null);
    };

    const register = async (userData: any) => {
        const response = await authAPI.register(userData);
        // Don't auto-login after registration
        return response;
    };

    const hasPermission = (permission: Permission): boolean => {
        if (!currentUser) return false;

        // Super Admin has all permissions
        if (currentUser.role === 'SUPER_ADMIN') return true;

        // Check if user has the specific permission
        return currentUser.permissions.includes(permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'SUPER_ADMIN') return true;
        return permissions.some(p => currentUser.permissions.includes(p));
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAuthenticated: !!currentUser,
                isLoading,
                login,
                logout,
                register,
                hasPermission,
                hasAnyPermission,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
