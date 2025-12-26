import { Router } from 'express';
import { PrismaClient, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper to get default permissions
const getDefaultPermissions = (role: string): Permission[] => {
    switch (role) {
        case 'SUPER_ADMIN':
            return [];
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // @ts-ignore
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                ...(user.shopId && { shopId: user.shopId }),
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            token,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/register
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const { email, password, name, role, shopId, shopName } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const permissions = getDefaultPermissions(role);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                shopId,
                permissions,
            },
        });

        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            user: userWithoutPassword,
            // @ts-ignore
            token: jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    ...(user.shopId && { shopId: user.shopId })
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            ),
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                shopId: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, (req: any, res) => {
    // @ts-ignore
    const token = jwt.sign(
        {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            ...(req.user.shopId && { shopId: req.user.shopId }),
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token });
});

export default router;
