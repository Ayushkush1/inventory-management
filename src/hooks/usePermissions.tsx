import { useAuth } from '../context/AuthContext';
import type { Permission } from '../types';

export const usePermissions = () => {
    const { currentUser, hasPermission } = useAuth();

    return {
        // Permission checks
        canViewInventory: hasPermission('VIEW_INVENTORY'),
        canAddProduct: hasPermission('ADD_PRODUCT'),
        canEditProduct: hasPermission('EDIT_PRODUCT'),
        canDeleteProduct: hasPermission('DELETE_PRODUCT'),
        canManageStock: hasPermission('MANAGE_STOCK'),
        canViewReports: hasPermission('VIEW_REPORTS'),
        canManageSettings: hasPermission('MANAGE_SETTINGS'),
        canCreateShopManager: hasPermission('CREATE_SHOP_MANAGER'),
        canManageMetalRates: hasPermission('MANAGE_METAL_RATES'),
        canUpdateMetalRates: hasPermission('UPDATE_METAL_RATES'),

        // Role checks
        isSuperAdmin: currentUser?.role === 'SUPER_ADMIN',
        isShopOwner: currentUser?.role === 'SHOP_OWNER',
        isShopManager: currentUser?.role === 'SHOP_MANAGER',

        // Current user info
        currentUser,
        shopId: currentUser?.shopId,
    };
};

// Helper function to get default permissions for a role
export const getDefaultPermissions = (role: string): Permission[] => {
    switch (role) {
        case 'SUPER_ADMIN':
            return []; // Super admin has all permissions by default

        case 'SHOP_OWNER':
            return [
                'VIEW_INVENTORY',
                'ADD_PRODUCT',
                'EDIT_PRODUCT',
                'DELETE_PRODUCT',
                'MANAGE_STOCK',
                'VIEW_REPORTS',
                'MANAGE_SETTINGS',
                'CREATE_SHOP_MANAGER',
                'MANAGE_METAL_RATES',
                'UPDATE_METAL_RATES',
            ];

        case 'SHOP_MANAGER':
            return [
                'VIEW_INVENTORY',
                'MANAGE_STOCK', // Can mark as sold
            ];

        default:
            return [];
    }
};
