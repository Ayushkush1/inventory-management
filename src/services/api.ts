import type { User, Shop, AuthResponse, Permission } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('auth_token');

// Helper function to make authenticated requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json();
}

// ============================================
// Authentication API
// ============================================

export const authAPI = {
    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // Store token and user
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('current_user', JSON.stringify(data.user));

        return data;
    },

    async register(userData: {
        email: string;
        password: string;
        name: string;
        role: string;
        shopId?: string;
        shopName?: string;
    }): Promise<AuthResponse> {
        return fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async logout(): Promise<void> {
        try {
            await fetchAPI('/auth/logout', { method: 'POST' });
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
        }
    },

    async getCurrentUser(): Promise<User> {
        // Try to get from localStorage first
        const cached = localStorage.getItem('current_user');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                // Invalid cache, fetch from API
            }
        }

        const user = await fetchAPI('/auth/me');
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    },

    async refreshToken(): Promise<{ token: string }> {
        return fetchAPI('/auth/refresh', { method: 'POST' });
    },
};

// ============================================
// Shop API (Super Admin only)
// ============================================

export const shopAPI = {
    async getAll(): Promise<Shop[]> {
        return fetchAPI('/shops');
    },

    async create(shopData: { name: string; ownerEmail: string; ownerName: string; ownerPassword: string }): Promise<Shop> {
        return fetchAPI('/shops', {
            method: 'POST',
            body: JSON.stringify(shopData),
        });
    },

    async getById(shopId: string): Promise<Shop> {
        return fetchAPI(`/shops/${shopId}`);
    },

    async update(shopId: string, data: Partial<Shop>): Promise<Shop> {
        return fetchAPI(`/shops/${shopId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(shopId: string): Promise<void> {
        return fetchAPI(`/shops/${shopId}`, { method: 'DELETE' });
    },
};

// ============================================
// User API (Shop Owner creates managers)
// ============================================

export const userAPI = {
    async getShopUsers(shopId: string): Promise<User[]> {
        return fetchAPI(`/users?shopId=${shopId}`);
    },

    async createShopManager(userData: {
        email: string;
        password: string;
        name: string;
        shopId: string;
        permissions: Permission[];
    }): Promise<User> {
        return fetchAPI('/users', {
            method: 'POST',
            body: JSON.stringify({ ...userData, role: 'SHOP_MANAGER' }),
        });
    },

    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        return fetchAPI(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async deleteUser(userId: string): Promise<void> {
        return fetchAPI(`/users/${userId}`, { method: 'DELETE' });
    },
};

// ============================================
// Inventory API (Shop-scoped)
// ============================================

export const inventoryAPI = {
    // Categories
    async getCategories(shopId: string) {
        return fetchAPI(`/inventory/categories?shopId=${shopId}`);
    },

    async createCategory(data: any) {
        return fetchAPI('/inventory/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCategory(id: string, data: any) {
        return fetchAPI(`/inventory/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async deleteCategory(id: string) {
        return fetchAPI(`/inventory/categories/${id}`, { method: 'DELETE' });
    },

    // SubCategories
    async getSubCategories(shopId: string) {
        return fetchAPI(`/inventory/subcategories?shopId=${shopId}`);
    },

    async createSubCategory(data: any) {
        return fetchAPI('/inventory/subcategories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteSubCategory(id: string) {
        return fetchAPI(`/inventory/subcategories/${id}`, { method: 'DELETE' });
    },

    // Products
    async getProducts(shopId: string) {
        return fetchAPI(`/inventory/products?shopId=${shopId}`);
    },

    async createProduct(data: any) {
        return fetchAPI('/inventory/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProduct(id: string, data: any) {
        return fetchAPI(`/inventory/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async deleteProduct(id: string) {
        return fetchAPI(`/inventory/products/${id}`, { method: 'DELETE' });
    },

    // Transactions
    async getTransactions(shopId: string) {
        return fetchAPI(`/inventory/transactions?shopId=${shopId}`);
    },

    async createTransaction(data: any) {
        return fetchAPI('/inventory/transactions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Metal Rates
    async getMetalRates(shopId: string) {
        return fetchAPI(`/inventory/metal-rates?shopId=${shopId}`);
    },

    async updateMetalRates(shopId: string, data: { goldRate: number; silverRate: number }) {
        return fetchAPI(`/inventory/metal-rates/${shopId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Shop Settings
    async getShopSettings(shopId: string) {
        return fetchAPI(`/inventory/settings?shopId=${shopId}`);
    },

    async updateShopSettings(shopId: string, data: { shopName: string }) {
        return fetchAPI(`/inventory/settings/${shopId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
};

export default {
    auth: authAPI,
    shop: shopAPI,
    user: userAPI,
    inventory: inventoryAPI,
};
