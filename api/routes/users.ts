import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users - Get users in shop (Shop Owner only)
router.get('/', authMiddleware, requireRole('SHOP_OWNER'), async (req: AuthRequest, res) => {
    try {
        const { shopId } = req.query;

        const users = await prisma.user.findMany({
            where: { shopId: shopId as string },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/users - Create shop manager (Shop Owner only)
router.post('/', authMiddleware, requireRole('SHOP_OWNER'), async (req, res) => {
    try {
        const { email, password, name, shopId, permissions } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'SHOP_MANAGER',
                shopId,
                permissions: permissions || ['VIEW_INVENTORY', 'MANAGE_STOCK'],
            },
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

        res.status(201).json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH /api/users/:id - Update user
router.patch('/:id', authMiddleware, requireRole('SHOP_OWNER'), async (req, res) => {
    try {
        const { name, permissions } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name, permissions },
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

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authMiddleware, requireRole('SHOP_OWNER'), async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id },
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
