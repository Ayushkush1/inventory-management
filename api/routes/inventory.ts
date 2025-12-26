import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Categories
router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const categories = await prisma.category.findMany({
            where: { shopId: shopId as string },
        });
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/categories', authMiddleware, async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: req.body,
        });
        res.status(201).json(category);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// SubCategories
router.get('/subcategories', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const subCategories = await prisma.subCategory.findMany({
            where: { shopId: shopId as string },
        });
        res.json(subCategories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/subcategories', authMiddleware, async (req, res) => {
    try {
        const subCategory = await prisma.subCategory.create({
            data: req.body,
        });
        res.status(201).json(subCategory);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Products
router.get('/products', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const products = await prisma.product.findMany({
            where: { shopId: shopId as string },
        });
        res.json(products);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/products', authMiddleware, async (req, res) => {
    try {
        const product = await prisma.product.create({
            data: req.body,
        });
        res.status(201).json(product);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/products/:id', authMiddleware, async (req, res) => {
    try {
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(product);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/products/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Transactions
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const transactions = await prisma.stockTransaction.findMany({
            where: { shopId: shopId as string },
            orderBy: { timestamp: 'desc' },
        });
        res.json(transactions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/transactions', authMiddleware, async (req, res) => {
    try {
        const transaction = await prisma.stockTransaction.create({
            data: {
                ...req.body,
                timestamp: Date.now(),
            },
        });
        res.status(201).json(transaction);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Metal Rates
router.get('/metal-rates', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const metalRates = await prisma.metalRate.findUnique({
            where: { shopId: shopId as string },
        });
        res.json(metalRates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/metal-rates/:shopId', authMiddleware, async (req, res) => {
    try {
        const metalRates = await prisma.metalRate.update({
            where: { shopId: req.params.shopId },
            data: req.body,
        });
        res.json(metalRates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Shop Settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.query;
        const settings = await prisma.shopSettings.findUnique({
            where: { shopId: shopId as string },
        });
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/settings/:shopId', authMiddleware, async (req, res) => {
    try {
        const settings = await prisma.shopSettings.update({
            where: { shopId: req.params.shopId },
            data: req.body,
        });
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
