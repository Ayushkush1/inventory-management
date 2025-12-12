export type MetalType = 'Gold' | 'Silver';
export type ProductType = 'Individual' | 'Group';
export type TransactionType = 'STOCK_IN' | 'STOCK_OUT';
export type StockReason = 'Sale' | 'Damage' | 'Transfer' | 'Adjustment' | 'Purchase' | 'Return';
export type MakingChargeType = 'per_gram' | 'per_piece';

export interface Category {
    id: string;
    name: string;
    type: MetalType;
}

export interface SubCategory {
    id: string;
    categoryId: string;
    name: string;
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
    weight: number; // For individual items, this is weight per piece. For group, it might be total weight.
    quantity: number; // For individual, usually 1 unless bulk. For group, count of items in packet.
    makingCharge: number;
    makingChargeType: MakingChargeType;
    profitPercent: number;
    status: 'Active' | 'Inactive';
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
    date: string; // ISO string
    timestamp: number;
}

export interface MetalRate {
    goldRate: number; // Per gram
    silverRate: number; // Per gram
    updatedAt: string;
}

export interface ShopSettings {
    shopName: string;
    updatedAt: string;
}

export interface AppState {
    categories: Category[];
    subCategories: SubCategory[];
    products: Product[];
    transactions: StockTransaction[];
    metalRates: MetalRate;
    shopSettings: ShopSettings;
}
