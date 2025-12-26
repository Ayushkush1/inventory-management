// User & Authentication Types
export type UserRole = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'SHOP_MANAGER';

export type Permission =
    | 'VIEW_INVENTORY'
    | 'ADD_PRODUCT'
    | 'EDIT_PRODUCT'
    | 'DELETE_PRODUCT'
    | 'MANAGE_STOCK'
    | 'VIEW_REPORTS'
    | 'MANAGE_SETTINGS'
    | 'CREATE_SHOP_MANAGER'
    | 'MANAGE_METAL_RATES'
    | 'UPDATE_METAL_RATES';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    shopId?: string;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
}

export interface Shop {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// Existing Product Types
export type MetalType = 'Gold' | 'Silver';
export type ProductType = 'Individual' | 'Group';
export type TransactionType = 'STOCK_IN' | 'STOCK_OUT';
export type StockReason = 'Sale' | 'Damage' | 'Transfer' | 'Adjustment' | 'Purchase' | 'Return';
export type MakingChargeType = 'per_gram' | 'per_piece';

export interface Category {
    id: string;
    name: string;
    type: MetalType;
    shopId: string;
}

export interface SubCategory {
    id: string;
    categoryId: string;
    name: string;
    shopId: string;
}

export interface Product {
    id: string;
    itemType: ProductType;
    categoryId: string;
    subCategoryId: string;
    name: string;
    sku: string;
    barcode: string;
    hsnCode?: string;
    weight: number;
    quantity: number;
    makingCharge: number;
    makingChargeType: MakingChargeType;
    profitPercent: number;
    status: 'Active' | 'Inactive';
    shopId: string;
    createdAt: string;
    updatedAt: string;
}

export interface StockTransaction {
    id: string;
    productId: string;
    type: TransactionType;
    quantity: number;
    weight: number;
    reason?: StockReason;
    date: string;
    timestamp: number;
    shopId: string;
}

export interface MetalRate {
    goldRate: number;
    silverRate: number;
    shopId: string;
    updatedAt: string;
}

export interface ShopSettings {
    shopName: string;
    shopId: string;
    updatedAt: string;
}

export interface AppState {
    shops: Shop[];
    users: User[];
    categories: Category[];
    subCategories: SubCategory[];
    products: Product[];
    transactions: StockTransaction[];
    metalRates: MetalRate;
    shopSettings: ShopSettings;
}

