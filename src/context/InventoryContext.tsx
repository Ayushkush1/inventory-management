import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { inventoryAPI } from '../services/api';
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
    addCategory: (category: Omit<Category, 'id' | 'shopId'>) => string;
    addSubCategory: (subCategory: Omit<SubCategory, 'id' | 'shopId'>) => string;
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'shopId'>) => void;
    addTransaction: (transaction: Omit<StockTransaction, 'id' | 'date' | 'timestamp' | 'shopId'>) => void;
    updateMetalRates: (rates: Omit<MetalRate, 'updatedAt' | 'shopId'>) => void;
    updateProduct: (id: string, product: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    updateShopSettings: (settings: Omit<ShopSettings, 'updatedAt' | 'shopId'>) => void;
    deleteCategory: (id: string) => void;
    deleteSubCategory: (id: string) => void;
    calculatePrice: (product: Product) => number;
    isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const INITIAL_STATE: Omit<AppState, 'shops' | 'users'> = {
    categories: [],
    subCategories: [],
    products: [],
    transactions: [],
    metalRates: { goldRate: 0, silverRate: 0, shopId: '', updatedAt: new Date().toISOString() },
    shopSettings: { shopName: 'JEWELLERY STORE', shopId: '', updatedAt: new Date().toISOString() },
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const shopId = currentUser?.shopId || '';
    const [isLoading, setIsLoading] = useState(false);

    const [state, setState] = useState<Omit<AppState, 'shops' | 'users'>>(() => {
        const saved = localStorage.getItem('inventory_app_v1');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...INITIAL_STATE,
                ...parsed,
                shopSettings: parsed.shopSettings || INITIAL_STATE.shopSettings
            };
        }
        return INITIAL_STATE;
    });

    // Load data from API when shopId is available
    useEffect(() => {
        if (shopId && currentUser) {
            loadDataFromAPI();
        }
    }, [shopId, currentUser]);

    const loadDataFromAPI = async () => {
        if (!shopId) return;

        setIsLoading(true);
        try {
            const [categories, subCategories, products, transactions, metalRates, shopSettings] = await Promise.all([
                inventoryAPI.getCategories(shopId),
                inventoryAPI.getSubCategories(shopId),
                inventoryAPI.getProducts(shopId),
                inventoryAPI.getTransactions(shopId),
                inventoryAPI.getMetalRates(shopId),
                inventoryAPI.getShopSettings(shopId)
            ]);

            setState({
                categories: categories || [],
                subCategories: subCategories || [],
                products: products || [],
                transactions: transactions || [],
                metalRates: metalRates || INITIAL_STATE.metalRates,
                shopSettings: shopSettings || INITIAL_STATE.shopSettings,
            });
        } catch (error) {
            console.error('Failed to load inventory data:', error);
            // Fall back to localStorage
        } finally {
            setIsLoading(false);
        }
    };

    // Save to localStorage for backward compatibility
    useEffect(() => {
        if (!shopId) {
            localStorage.setItem('inventory_app_v1', JSON.stringify(state));
        }
    }, [state, shopId]);

    const addCategory = (category: Omit<Category, 'id' | 'shopId'>) => {
        const newCategory = { ...category, id: uuidv4(), shopId };

        if (shopId) {
            inventoryAPI.createCategory(newCategory).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            categories: [...prev.categories, newCategory]
        }));
        return newCategory.id;
    };

    const addSubCategory = (subCategory: Omit<SubCategory, 'id' | 'shopId'>) => {
        const newSub = { ...subCategory, id: uuidv4(), shopId };

        if (shopId) {
            inventoryAPI.createSubCategory(newSub).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            subCategories: [...prev.subCategories, newSub]
        }));
        return newSub.id;
    };

    const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'shopId'>) => {
        const newId = uuidv4();
        const timestamp = new Date().toISOString();

        const newProduct: Product = {
            ...product,
            id: newId,
            shopId,
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
            weight: product.weight * product.quantity,
            reason: 'Purchase',
            date: timestamp,
            timestamp: Date.now(),
            shopId
        };

        if (shopId) {
            Promise.all([
                inventoryAPI.createProduct(newProduct),
                inventoryAPI.createTransaction(initialTransaction)
            ]).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            products: [...prev.products, newProduct],
            transactions: [...prev.transactions, initialTransaction]
        }));
    };

    const addTransaction = (transaction: Omit<StockTransaction, 'id' | 'date' | 'timestamp' | 'shopId'>) => {
        const newTransaction: StockTransaction = {
            ...transaction,
            id: uuidv4(),
            date: new Date().toISOString(),
            timestamp: Date.now(),
            shopId
        };

        if (shopId) {
            inventoryAPI.createTransaction(newTransaction).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, newTransaction]
        }));
    };

    const updateMetalRates = (rates: Omit<MetalRate, 'updatedAt' | 'shopId'>) => {
        const updatedRates = {
            ...rates,
            shopId,
            updatedAt: new Date().toISOString()
        };

        if (shopId) {
            inventoryAPI.updateMetalRates(shopId, rates).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            metalRates: updatedRates
        }));
    };

    const updateProduct = (id: string, product: Partial<Product>) => {
        if (shopId) {
            inventoryAPI.updateProduct(id, product).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            products: prev.products.map(p =>
                p.id === id ? { ...p, ...product, updatedAt: new Date().toISOString() } : p
            )
        }));
    };

    const deleteProduct = (id: string) => {
        if (shopId) {
            inventoryAPI.deleteProduct(id).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== id),
            transactions: prev.transactions.filter(t => t.productId !== id)
        }));
    };

    const updateShopSettings = (settings: Omit<ShopSettings, 'updatedAt' | 'shopId'>) => {
        const updatedSettings = {
            ...settings,
            shopId,
            updatedAt: new Date().toISOString()
        };

        if (shopId) {
            inventoryAPI.updateShopSettings(shopId, settings).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            shopSettings: updatedSettings
        }));
    };

    const deleteCategory = (id: string) => {
        if (shopId) {
            inventoryAPI.deleteCategory(id).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== id),
            subCategories: prev.subCategories.filter(sc => sc.categoryId !== id),
            products: prev.products.filter(p => p.categoryId !== id)
        }));
    };

    const deleteSubCategory = (id: string) => {
        if (shopId) {
            inventoryAPI.deleteSubCategory(id).catch(console.error);
        }

        setState(prev => ({
            ...prev,
            subCategories: prev.subCategories.filter(sc => sc.id !== id)
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
        <InventoryContext.Provider
            value={{
                ...state,
                shops: [],
                users: [],
                addCategory,
                addSubCategory,
                addProduct,
                addTransaction,
                updateMetalRates,
                updateProduct,
                deleteProduct,
                updateShopSettings,
                deleteCategory,
                deleteSubCategory,
                calculatePrice,
                isLoading
            }}
        >
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
