
import { useInventory } from '../../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import {
    Coins,
    TrendingUp,
    Plus,
    ArrowRight,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Package,
} from 'lucide-react';

const Dashboard = () => {
    const { products, categories, transactions, metalRates } = useInventory();
    const navigate = useNavigate();


    // Calculate stats
    const getTotalWeight = (metalType: 'Gold' | 'Silver') => {
        return products
            .filter(p => categories.find(c => c.id === p.categoryId)?.type === metalType)
            .reduce((sum, p) => sum + p.weight, 0);
    };

    const getTotalValue = (metalType: 'Gold' | 'Silver') => {
        const weight = getTotalWeight(metalType);
        const rate = metalType === 'Gold' ? metalRates.goldRate : metalRates.silverRate;
        return weight * rate;
    };

    const getSoldToday = (metalType: 'Gold' | 'Silver') => {
        const today = new Date().toDateString();
        return transactions
            .filter(t => {
                const product = products.find(p => p.id === t.productId);
                const category = categories.find(c => c.id === product?.categoryId);
                return t.type === 'STOCK_OUT' &&
                    category?.type === metalType &&
                    new Date(t.date).toDateString() === today;
            })
            .reduce((sum, t) => sum + t.weight, 0);
    };

    const getLowStockProducts = () => {
        return products.filter(p => p.quantity <= 2);
    };

    const getRecentTransactions = () => {
        return transactions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const goldWeight = getTotalWeight('Gold');
    const silverWeight = getTotalWeight('Silver');
    const goldValue = getTotalValue('Gold');
    const silverValue = getTotalValue('Silver');
    const goldSoldToday = getSoldToday('Gold');
    const silverSoldToday = getSoldToday('Silver');
    const recentTransactions = getRecentTransactions();
    const lowStockItems = getLowStockProducts();

    return (
        <div className="animate-fade-in pb-8">
            {/* Header Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Gold Card */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 shadow-lg shadow-amber-500/5 relative overflow-hidden group border border-amber-100">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-200/30 transition-all duration-500"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Coins size={20} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-semibold bg-amber-500/10 px-2 py-1 rounded text-amber-800 border border-amber-200/50">
                            ₹{metalRates.goldRate}/g
                        </span>
                    </div>

                    <div className="relative z-10">
                        <div className="text-xs font-bold text-amber-700/70 mb-0.5 uppercase tracking-wide">Total Gold Value</div>
                        <div className="text-2xl font-bold mb-1 tracking-tight text-amber-900">{formatCurrency(goldValue)}</div>
                        <div className="flex items-center gap-2 text-sm font-medium mt-2">
                            <span className="bg-white/60 px-2 py-1 rounded text-xs text-amber-800 border border-amber-200/50 shadow-sm">{goldWeight.toFixed(2)}g in stock</span>
                        </div>
                    </div>
                </div>

                {/* Silver Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-5 shadow-lg shadow-slate-200/50 relative overflow-hidden group border border-slate-200/60">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-slate-200/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-slate-200/30 transition-all duration-500"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 bg-slate-200/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Coins size={20} className="text-slate-600" />
                        </div>
                        <span className="text-xs font-semibold bg-slate-200/50 px-2 py-1 rounded text-slate-700 border border-slate-200/50">
                            ₹{metalRates.silverRate}/g
                        </span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xs font-bold text-slate-500 mb-0.5 uppercase tracking-wide">Total Silver Value</div>
                        <div className="text-2xl font-bold mb-1 tracking-tight text-slate-900">{formatCurrency(silverValue)}</div>
                        <div className="flex items-center gap-2 text-sm font-medium mt-2">
                            <span className="bg-white/60 px-2 py-1 rounded text-xs text-slate-700 border border-slate-200/50 shadow-sm">{silverWeight.toFixed(2)}g in stock</span>
                        </div>
                    </div>
                </div>

                {/* Today's Gold Sales */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">Today</span>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 mb-0.5">Gold Sold Today</div>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{goldSoldToday.toFixed(2)}g</div>
                        <div className="text-xs text-slate-400">Recorded transactions</div>
                    </div>
                </div>

                {/* Today's Silver Sales */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp size={20} className="text-indigo-600" />
                        </div>
                        <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">Today</span>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 mb-0.5">Silver Sold Today</div>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{silverSoldToday.toFixed(2)}g</div>
                        <div className="text-xs text-slate-400">Recorded transactions</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Actions & Categories */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ArrowUpRight size={16} className="text-slate-400" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/products?mode=add')}
                                className="col-span-2 flex items-center justify-center gap-2 bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                            >
                                <Plus size={18} />
                                <span className="font-medium text-sm">Add New Product</span>
                            </button>
                            <button
                                onClick={() => navigate('/stock')}
                                className="flex flex-col items-center justify-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                            >
                                <ArrowDownRight size={18} />
                                <span className="font-medium text-xs">Stock In</span>
                            </button>
                            <button
                                onClick={() => navigate('/stock')}
                                className="flex flex-col items-center justify-center gap-2 bg-rose-50 text-rose-700 p-3 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                                <ArrowUpRight size={18} />
                                <span className="font-medium text-xs">Stock Out</span>
                            </button>
                        </div>
                    </div>

                    {/* Low Stock Alert */}
                    {lowStockItems.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm animate-pulse-slow">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-rose-600 fill-rose-600/20" />
                                    <span className="text-sm font-bold text-rose-800">Low Stock Alert</span>
                                </div>
                                <span className="text-xs font-medium bg-white/60 px-2 py-1 rounded-full text-rose-700 shadow-sm">
                                    {lowStockItems.length} items
                                </span>
                            </div>
                            <div className="flex gap-3 flex-col overflow-x-auto pb-2 scrollbar-hide">
                                {lowStockItems.map(item => (
                                    <div key={item.id}
                                        onClick={() => navigate(`/products?edit=${item.id}`)}
                                        className="min-w-[140px] bg-white p-3 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex-shrink-0"
                                    >
                                        <div className="text-xs font-medium text-slate-500 mb-1">{categories.find(c => c.id === item.categoryId)?.name}</div>
                                        <div className="text-sm font-bold text-slate-900 truncate">{item.name}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-rose-600 font-bold">{item.quantity} left</span>
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{item.weight}g</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Middle Column: Recent Activity */}
                <div className="lg:col-span-2 space-y-6">


                    {/* Transactions */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full max-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                            <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
                            <button
                                onClick={() => navigate('/reports')}
                                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                            >
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-lg">Product</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Reason</th>
                                        <th className="px-6 py-4 text-right">Qty</th>
                                        <th className="px-6 py-4 text-right rounded-tr-lg">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.map(transaction => {
                                            const product = products.find(p => p.id === transaction.productId);
                                            return (
                                                <tr key={transaction.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${transaction.type === 'STOCK_IN'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                {transaction.type === 'STOCK_IN' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">{product?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${transaction.type === 'STOCK_IN'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                            }`}>
                                                            {transaction.reason}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 text-right font-medium">
                                                        {transaction.quantity}
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm font-bold text-right font-mono ${transaction.type === 'STOCK_IN' ? 'text-emerald-600' : 'text-rose-600'
                                                        }`}>
                                                        {transaction.type === 'STOCK_IN' ? '+' : '-'}{transaction.weight}g
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Package size={48} className="mb-4 opacity-20" />
                                                    <p className="text-sm font-medium">No transactions recorded yet</p>
                                                    <p className="text-xs opacity-60 mt-1">Start by adding stock or making sales</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>


        </div >
    );
};

export default Dashboard;
