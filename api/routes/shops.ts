import { Router } from 'express';
import { PrismaClient, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to get default permissions
const getDefaultPermissions = (role: string): Permission[] => {
    switch (role) {
        case 'SHOP_OWNER':
            return [
                Permission.VIEW_INVENTORY,
                Permission.ADD_PRODUCT,
                Permission.EDIT_PRODUCT,
                Permission.DELETE_PRODUCT,
                Permission.MANAGE_STOCK,
                Permission.VIEW_REPORTS,
                Permission.MANAGE_SETTINGS,
                Permission.CREATE_SHOP_MANAGER,
                Permission.MANAGE_METAL_RATES,
                'UPDATE_METAL_RATES' as Permission,
            ];
        case 'SHOP_MANAGER':
            return [Permission.VIEW_INVENTORY, Permission.MANAGE_STOCK];
        default:
            return [];
    }
};

// GET /api/shops - Get all shops (Super Admin only)
router.get('/', authMiddleware, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const shops = await prisma.shop.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.json(shops);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/shops - Create new shop with owner (Super Admin only)
router.post('/', authMiddleware, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { name, ownerName, ownerEmail, ownerPassword } = req.body;

        // Check if owner email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: ownerEmail },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(ownerPassword, 10);

        // Create shop and owner in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the shop owner first
            const owner = await tx.user.create({
                data: {
                    email: ownerEmail,
                    password: hashedPassword,
                    name: ownerName,
                    role: 'SHOP_OWNER',
                    permissions: getDefaultPermissions('SHOP_OWNER'),
                },
            });

            // Create the shop
            const shop = await tx.shop.create({
                data: {
                    name,
                    ownerId: owner.id,
                },
            });

            // Update owner with shopId
            await tx.user.update({
                where: { id: owner.id },
                data: { shopId: shop.id },
            });

            // Initialize shop settings and metal rates
            await tx.shopSettings.create({
                data: {
                    shopName: name,
                    shopId: shop.id,
                },
            });

            await tx.metalRate.create({
                data: {
                    shopId: shop.id,
                    goldRate: 0,
                    silverRate: 0,
                },
            });

            return shop;
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/shops/:id - Get shop by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const shop = await prisma.shop.findUnique({
            where: { id: req.params.id },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        res.json(shop);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
