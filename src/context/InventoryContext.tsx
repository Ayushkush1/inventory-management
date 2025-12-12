import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
    AppState,
    Category,
    Product,
    StockTransaction,
    MetalRate,
    SubCategory,
    ShopSettings
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface InventoryContextType extends AppState {
    addCategory: (category: Omit<Category, 'id'>) => string;
    addSubCategory: (subCategory: Omit<SubCategory, 'id'>) => string;
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
    addTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'timestamp'>) => void;
    updateMetalRates: (rates: Omit<MetalRate, 'updatedAt'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    updateShopSettings: (settings: Omit<ShopSettings, 'updatedAt'>) => void;
    deleteCategory: (id: string) => void;
    deleteSubCategory: (id: string) => void;
    calculatePrice: (product: Product) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_STATE: AppState = {
    categories: [],
    subCategories: [],
    products: [],
    transactions: [],
    metalRates: { goldRate: 0, silverRate: 0, updatedAt: new Date().toISOString() },
    shopSettings: { shopName: 'JEWELLERY STORE', updatedAt: new Date().toISOString() },
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem('inventory_app_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: Add shopSettings if it doesn't exist
            return {
                ...INITIAL_STATE,
                ...parsed,
                shopSettings: parsed.shopSettings || INITIAL_STATE.shopSettings
            };
        }
        return INITIAL_STATE;
    });

    useEffect(() => {
        localStorage.setItem('inventory_app_v1', JSON.stringify(state));
    }, [state]);

    const addCategory = (category: Omit<Category, 'id'>) => {
        const newCategory = { ...category, id: uuidv4() };
        setState(prev => ({
            ...prev,
            categories: [...prev.categories, newCategory]
        }));
        return newCategory.id;
    };

    const addSubCategory = (subCategory: Omit<SubCategory, 'id'>) => {
        const newSub = { ...subCategory, id: uuidv4() };
        setState(prev => ({
            ...prev,
            subCategories: [...prev.subCategories, newSub]
        }));
        return newSub.id;
    };

    const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
        const newId = uuidv4();
        const timestamp = new Date().toISOString();

        const newProduct: Product = {
            ...product,
            id: newId,
            status: 'Active',
            createdAt: timestamp,
            updatedAt: timestamp
        };

        // Create initial stock transaction
        const initialTransaction: StockTransaction = {
            id: uuidv4(),
            productId: newId,
            type: 'STOCK_IN',
            quantity: product.quantity,
            weight: product.weight * product.quantity, // Total weight added
            reason: 'Purchase',
            date: timestamp,
            timestamp: Date.now()
        };

        setState(prev => ({
            ...prev,
            products: [...prev.products, newProduct],
            transactions: [...prev.transactions, initialTransaction]
        }));
    };

    const updateProduct = (id: string, updates: Partial<Product>) => {
        setState(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
        }));
    };

    const updateMetalRates = (rates: Omit<MetalRate, 'updatedAt'>) => {
        setState(prev => ({
            ...prev,
            metalRates: {
                ...rates,
                updatedAt: new Date().toISOString()
            }
        }));
    };

    const addTransaction = (transaction: Omit<StockTransaction, 'id' | 'date' | 'timestamp'>) => {
        const newTx: StockTransaction = {
            ...transaction,
            id: uuidv4(),
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        setState(prev => {
            const updatedProducts = prev.products.map(p => {
                if (p.id === transaction.productId) {
                    const isIn = transaction.type === 'STOCK_IN';
                    return {
                        ...p,
                        quantity: isIn ? p.quantity + transaction.quantity : p.quantity - transaction.quantity,
                        weight: isIn ? p.weight + transaction.weight : p.weight - transaction.weight,
                    };
                }
                return p;
            });

            return {
                ...prev,
                transactions: [...prev.transactions, newTx],
                products: updatedProducts
            };
        });
    };

    const deleteProduct = (id: string) => {
        setState(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== id)
        }));
    }

    const updateShopSettings = (settings: Omit<ShopSettings, 'updatedAt'>) => {
        setState(prev => ({
            ...prev,
            shopSettings: {
                ...settings,
                updatedAt: new Date().toISOString()
            }
        }));
    };

    const deleteCategory = (id: string) => {
        setState(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== id),
            subCategories: prev.subCategories.filter(s => s.categoryId !== id)
        }));
    };

    const deleteSubCategory = (id: string) => {
        setState(prev => ({
            ...prev,
            subCategories: prev.subCategories.filter(s => s.id !== id)
        }));
    };

    const calculatePrice = (product: Product): number => {
        const category = state.categories.find(c => c.id === product.categoryId);
        if (!category) return 0;

        const rate = category.type === 'Gold' ? state.metalRates.goldRate : state.metalRates.silverRate;
        const metalValue = product.weight * rate;

        let makingCost = 0;
        if (product.makingChargeType === 'per_gram') {
            makingCost = product.makingCharge * product.weight;
        } else if (product.makingChargeType === 'per_piece') {
            makingCost = product.makingCharge;
        }

        const totalCost = metalValue + makingCost;
        const sellPrice = totalCost * (1 + product.profitPercent / 100);

        return Math.round(sellPrice);
    };

    return (
        <InventoryContext.Provider value={{
            ...state,
            addCategory,
            addSubCategory,
            addProduct,
            addTransaction,
            updateMetalRates,
            updateProduct,
            deleteProduct,
            deleteCategory,
            deleteSubCategory,
            updateShopSettings,
            calculatePrice
        }}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};
