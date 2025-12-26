import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { shopAPI } from '../../services/api';
import type { Shop } from '../../types';
import { Store, Plus, Users, LogOut, Loader2, X, Save } from 'lucide-react';
import Toast from '../../components/ui/Toast';

const SuperAdminDashboard = () => {
    const { logout, currentUser } = useAuth();
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        shopName: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
    });

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        try {
            setIsLoading(true);
            const data = await shopAPI.getAll();
            setShops(data);
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to load shops', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await shopAPI.create({
                name: formData.shopName,
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                ownerPassword: formData.ownerPassword,
            });

            setNotification({ message: 'Shop created successfully!', type: 'success' });
            setShowCreateModal(false);
            setFormData({ shopName: '', ownerName: '', ownerEmail: '', ownerPassword: '' });
            loadShops();
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to create shop', type: 'error' });
        }
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                                <Store size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
                                <p className="text-sm text-slate-500">Manage all shops and owners</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">{currentUser?.name}</p>
                                <p className="text-xs text-slate-500">{currentUser?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Shops</p>
                                <p className="text-3xl font-bold text-slate-900">{shops.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Store size={24} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Active Owners</p>
                                <p className="text-3xl font-bold text-slate-900">{shops.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <Users size={24} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full h-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20"
                        >
                            <Plus size={20} />
                            Create New Shop
                        </button>
                    </div>
                </div>

                {/* Shops List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900">All Shops</h2>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : shops.length === 0 ? (
                        <div className="text-center py-12">
                            <Store size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-600 font-medium">No shops created yet</p>
                            <p className="text-slate-400 text-sm mt-1">Create your first shop to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Shop Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Owner ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Created At
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {shops.map((shop) => (
                                        <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                        <Store size={20} className="text-amber-600" />
                                                    </div>
                                                    <span className="font-bold text-slate-900">{shop.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">{shop.ownerId.slice(0, 8)}...</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {new Date(shop.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Shop Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">Create New Shop</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateShop} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Shop Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.shopName}
                                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., Golden Jewellers"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.ownerName}
                                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.ownerEmail}
                                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="owner@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.ownerPassword}
                                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Create Shop
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
