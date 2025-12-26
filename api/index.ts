// Main API Entry Point v2
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import shopRoutes from './routes/shops.js';
import userRoutes from './routes/users.js';
import inventoryRoutes from './routes/inventory.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for production (you can restrict this if needed)
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Vercel Serverless Function running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server Error:', err);
    // Return detailed error in production for debugging (remove this later!)
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: err.stack,
        detail: err
    });
});

export default app;
