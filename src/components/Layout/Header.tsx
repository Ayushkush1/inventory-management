
import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useLocation } from 'react-router-dom';
import { Edit2, Save, X } from 'lucide-react';
import Toast from '../ui/Toast';

const Header = () => {
    const { metalRates, updateMetalRates } = useInventory();
    const location = useLocation();
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [editingMetal, setEditingMetal] = useState<'Gold' | 'Silver' | null>(null);
    const [newRate, setNewRate] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const openRateModal = (metal: 'Gold' | 'Silver') => {
        setEditingMetal(metal);
        setNewRate(metal === 'Gold' ? metalRates.goldRate.toString() : metalRates.silverRate.toString());
        setIsRateModalOpen(true);
    };

    const handleUpdateRate = () => {
        if (!editingMetal || !newRate) return;
        const rate = parseFloat(newRate);
        if (isNaN(rate)) return;

        updateMetalRates({
            goldRate: editingMetal === 'Gold' ? rate : metalRates.goldRate,
            silverRate: editingMetal === 'Silver' ? rate : metalRates.silverRate
        });
        setIsRateModalOpen(false);
        setEditingMetal(null);
        setNotification({ message: 'Metal Rates Updated Successfully', type: 'success' });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get page info based on route
    const getPageInfo = () => {
        const path = location.pathname;
        switch (path) {
            case '/':
                return { title: 'Welcome to the Dashboard', description: 'Inventory Command Center' };
            case '/products':
                return { title: 'Products', description: 'Manage your inventory items' };
            case '/stock-in':
                return { title: 'Stock In', description: 'Search or scan product to add new stock' };
            case '/stock-out':
                return { title: 'Stock Out', description: 'Search or scan product to sell or deduct stock' };
            case '/reports':
                return { title: 'Reports & Analytics', description: 'Track inventory performance and sales history.' };
            case '/settings':
                return { title: 'Settings', description: 'Manage preferences' };
            default:
                return { title: 'Dashboard', description: 'Inventory Command Center' };
        }
    };

    const pageInfo = getPageInfo();

    return (
        <header className="h-[85px] flex items-center justify-between px-8 sticky top-0 z-40 w-full">
            {/* Page Title */}
            <div className="flex items-center gap-3 pt-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{pageInfo.title}</h1>
                    <p className="text-sm text-slate-500">{pageInfo.description}</p>
                </div>
            </div>

            {/* Metal Rates & Profile */}
            <div className="flex gap-6 items-center">
                {/* Metal Rates */}
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-amber-100/50 border border-amber-100/50">
                        <span className="text-amber-700 font-medium">Gold:</span>
                        <span className="font-semibold text-amber-900">{formatCurrency(metalRates.goldRate)}/gm</span>
                        <button
                            onClick={() => openRateModal('Gold')}
                            className="p-1 hover:bg-amber-200/50 rounded transition-colors text-amber-700 ml-1"
                            title="Update Gold Rate"
                        >
                            <Edit2 size={12} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/50">
                        <span className="text-slate-600 font-medium">Silver:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(metalRates.silverRate)}/gm</span>
                        <button
                            onClick={() => openRateModal('Silver')}
                            className="p-1 hover:bg-slate-200/50 rounded transition-colors text-slate-600 ml-1"
                            title="Update Silver Rate"
                        >
                            <Edit2 size={12} />
                        </button>
                    </div>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200/60">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-semibold text-white text-sm shadow-sm">
                        AD
                    </div>
                    <div className="text-sm">
                        <div className="font-semibold text-slate-900">Admin</div>
                        <div className="text-xs text-slate-500">Manager</div>
                    </div>
                </div>
            </div>
            {/* Notification Toast */}
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Rate Update Modal */}
            {isRateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Update {editingMetal} Rate</h3>
                            <button
                                onClick={() => setIsRateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Current Rate (per gram)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                <input
                                    type="number"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-bold text-lg text-slate-900"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsRateModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateRate}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                                >
                                    <Save size={18} />
                                    Update Rate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
