import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Search, ArrowDownRight, ArrowUpRight, Barcode, X, Save } from 'lucide-react';
import Toast from '../../components/ui/Toast';

const Stock = () => {
    const { products, categories, addTransaction, updateProduct, calculatePrice } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [actionType, setActionType] = useState<'in' | 'out' | null>(null);
    const [quantity, setQuantity] = useState('');
    const [weight, setWeight] = useState('');
    const [price, setPrice] = useState('');
    const [reason, setReason] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Auto-calculate price when weight changes
    useEffect(() => {
        if (!selectedProduct || !weight || !calculatePrice) return;

        const wt = parseFloat(weight);
        if (isNaN(wt) || wt <= 0) return;

        // Create a temporary product context with the new weight for calculation
        // We assume the user wants the price for the specific weight being transacted
        const tempProduct = { ...selectedProduct, weight: wt };
        const calculated = calculatePrice(tempProduct);
        setPrice(calculated.toString());
    }, [weight, selectedProduct, calculatePrice]);

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filter === 'all' ? true :
                filter === 'low' ? p.quantity <= 3 :
                    filter === 'out' ? p.quantity === 0 : true;

        return matchesSearch && matchesFilter;
    });

    const handleActionSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // If search matches exactly one barcode, open modal automatically
        const exactMatch = products.find(p => p.barcode === searchTerm);
        if (exactMatch) {
            handleOpenModal(exactMatch, 'in'); // Default to 'in'
        }
    };

    const handleOpenModal = (product: any, type: 'in' | 'out') => {
        setSelectedProduct(product);
        setActionType(type);
        // Pre-fill with existing product details as requested
        setQuantity(product.quantity.toString());
        setWeight(product.weight.toString());
        setPrice(''); // Will be auto-calculated by useEffect
        setReason(type === 'in' ? 'Purchase' : 'Sale');
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
        setActionType(null);
        setQuantity('');
        setWeight('');
        setPrice('');
        setReason('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !actionType) return;

        const qty = parseInt(quantity) || 0;
        const wt = parseFloat(weight) || 0;

        if (qty <= 0 && wt <= 0) {
            setNotification({ message: 'Please enter valid quantity or weight', type: 'error' });
            return;
        }

        if (actionType === 'out') {
            if (qty > selectedProduct.quantity) {
                setNotification({ message: 'Insufficient quantity in stock', type: 'error' });
                return;
            }
            if (wt > selectedProduct.weight) {
                setNotification({ message: 'Insufficient weight in stock', type: 'error' });
                return;
            }
        }

        // Add Transaction
        addTransaction({
            type: actionType === 'in' ? 'STOCK_IN' : 'STOCK_OUT',
            productId: selectedProduct.id,
            quantity: qty,
            weight: wt,
            reason: reason as any,
        });

        // Update Product Stock
        const newQuantity = actionType === 'in'
            ? selectedProduct.quantity + qty
            : selectedProduct.quantity - qty;

        const newWeight = actionType === 'in'
            ? selectedProduct.weight + wt
            : selectedProduct.weight - wt;

        updateProduct(selectedProduct.id, {
            ...selectedProduct,
            quantity: newQuantity,
            weight: newWeight
        });

        setNotification({
            message: `Stock ${actionType === 'in' ? 'Added' : 'Deducted'} Successfully`,
            type: 'success'
        });
        handleCloseModal();
    };

    return (
        <div className="animate-fade-in pb-8">
            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Search Header */}
            {/* Search and Filters Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4 items-center">
                <form onSubmit={handleActionSearch} className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="text-slate-400" size={20} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Scan barcode or search product to manage stock..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
                        autoFocus
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center">
                        <Barcode className="text-slate-400" size={20} />
                    </div>
                </form>

                <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border whitespace-nowrap flex-1 xl:flex-none text-center ${filter === 'all'
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border whitespace-nowrap flex-1 xl:flex-none text-center ${filter === 'low'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50'
                            }`}
                    >
                        Low Stock (≤ 3)
                    </button>
                    <button
                        onClick={() => setFilter('out')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border whitespace-nowrap flex-1 xl:flex-none text-center ${filter === 'out'
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50'
                            }`}
                    >
                        Out of Stock
                    </button>
                </div>
            </div>

            {/* Stock List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Current Weight</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Est. Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Current Qty</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const category = categories.find(c => c.id === product.categoryId);
                                    const currentPrice = useInventory().calculatePrice ? useInventory().calculatePrice(product) : 0;
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900">{product.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                                            {category?.name}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${product.itemType === 'Individual'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                            : 'bg-purple-50 text-purple-600 border-purple-100'
                                                            }`}>
                                                            {product.itemType === 'Individual' ? 'Indv' : 'Grp'}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono flex items-center gap-0.5">
                                                            <Barcode size={10} /> {product.barcode}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-700">{product.weight}</span>
                                                <span className="text-xs text-slate-400 ml-0.5">g</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-900">
                                                    ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(currentPrice)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[30px] h-6 px-2 rounded text-xs font-medium border ${product.quantity <= 2
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}>
                                                    {product.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => handleOpenModal(product, 'in')}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors text-xs font-bold"
                                                    >
                                                        <ArrowDownRight size={14} /> Stock In
                                                    </button>
                                                    {filter !== 'out' && (
                                                        <button
                                                            onClick={() => handleOpenModal(product, 'out')}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 transition-colors text-xs font-bold"
                                                        >
                                                            <ArrowUpRight size={14} /> Stock Out
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No products found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Modal */}
            {selectedProduct && actionType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className={`px-6 py-4 border-b flex items-center justify-between ${actionType === 'in' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                            }`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${actionType === 'in' ? 'text-emerald-800' : 'text-rose-800'
                                }`}>
                                {actionType === 'in' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                {actionType === 'in' ? 'Add Stock' : 'Deduct Stock'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-white/50 rounded-full transition-colors opacity-60 hover:opacity-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Selected Product</label>
                                <div className="text-base font-bold text-slate-800">{selectedProduct.name}</div>
                                <div className="text-sm text-slate-500">
                                    Current: {selectedProduct.weight}g | {selectedProduct.quantity} units
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Weight (g)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="0.00"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="0"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Total Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="0"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason / Notes</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                >
                                    {actionType === 'in' ? (
                                        <>
                                            <option value="Purchase">Purchase</option>
                                            <option value="Return">Customer Return</option>
                                            <option value="Adjustment">Inventory Adjustment</option>
                                            <option value="Other">Other</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Sale">Sale</option>
                                            <option value="Damage">Damage/Scrap</option>
                                            <option value="Adjustment">Inventory Adjustment</option>
                                            <option value="Other">Other</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-3 px-4 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${actionType === 'in'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                                        }`}
                                >
                                    <Save size={18} />
                                    Confirm {actionType === 'in' ? 'In' : 'Out'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;
