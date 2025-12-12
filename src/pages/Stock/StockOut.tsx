import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import type { Product, StockReason } from '../../types';
import { Search, Package, ArrowUpFromLine, AlertTriangle, Scale, X } from 'lucide-react';
import Toast from '../../components/ui/Toast';


const StockOut = () => {
    const { products, categories, addTransaction } = useInventory();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedMetal, setSelectedMetal] = useState('');

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [form, setForm] = useState({
        quantity: 0,
        weight: '',
        reason: 'Sale' as StockReason
    });

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);



    // Initialize form when product selected
    useEffect(() => {
        if (selectedProduct) {
            setForm(prev => ({ ...prev, quantity: 1, weight: (selectedProduct.weight / selectedProduct.quantity).toFixed(3) }));
        }
    }, [selectedProduct]);

    // Auto-search effect (Barcode Scanner)
    useEffect(() => {
        if (searchTerm.length > 2) {
            const found = products.find(p => p.barcode === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase());
            if (found && found.id !== selectedProduct?.id) {
                setSelectedProduct(found);
            }
        }
    }, [searchTerm, products, selectedProduct]);

    // Smart Weight Calculation
    const handleQuantityChange = (qty: number) => {
        if (!selectedProduct) return;
        // Auto-calc weight based on average (useful for groups or identical items)
        const avgWeight = selectedProduct.weight / selectedProduct.quantity;
        const estimatedWeight = (avgWeight * qty).toFixed(3);

        setForm(prev => ({
            ...prev,
            quantity: qty,
            weight: estimatedWeight
        }));
    };

    const handleStockOut = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        // Validation
        if (form.quantity > selectedProduct.quantity) {
            setNotification({ message: 'Error: Cannot affect more stock than available quantity.', type: 'error' });
            return;
        }

        addTransaction({
            productId: selectedProduct.id,
            type: 'STOCK_OUT',
            quantity: Number(form.quantity),
            weight: Number(form.weight),
            reason: form.reason
        });

        setNotification({ message: 'Stock Deducted (Sold/Out) Successfully', type: 'success' });
        // Don't clear search, just go back to list? Or clear selection
        setSelectedProduct(null);
        setForm({ quantity: 0, weight: '', reason: 'Sale' });
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
        const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
        const cat = categories.find(c => c.id === p.categoryId);
        const matchesMetal = selectedMetal ? cat?.type === selectedMetal : true;
        return matchesSearch && matchesCategory && matchesMetal;
    });

    return (
        <div className="animate-fade-in pb-8">

            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}


            <>
                {/* Filters Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-0 bg-blue-100 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 flex items-center p-0.5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                            <Search className="text-slate-400 ml-3" size={18} />
                            <input
                                type="text"
                                className="w-full pl-2 pr-4 py-2 bg-transparent border-none outline-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-sm font-medium"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-600 shadow-sm hover:border-blue-400 transition-colors"
                            value={selectedMetal}
                            onChange={e => setSelectedMetal(e.target.value)}
                        >
                            <option value="">All Metals</option>
                            <option value="Gold">Gold</option>
                            <option value="Silver">Silver</option>
                        </select>
                        <select
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium text-slate-600 shadow-sm hover:border-blue-400 transition-colors max-w-[150px]"
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white rounded-[24px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200 group relative cursor-pointer"
                        >
                            <div className="rounded-[20px] p-5 h-full flex flex-col border border-slate-100 group-hover:border-slate-200 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider ${product.itemType === 'Group' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {product.itemType}
                                        </span>
                                        <h3 className="font-bold text-slate-800 text-lg mt-2 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium mt-1">
                                            ID: <span className="font-mono">{product.sku}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stock</p>
                                        <p className="text-sm font-bold text-slate-700">{product.quantity} units</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weight</p>
                                        <p className="text-sm font-bold text-slate-700">{product.weight}gm</p>
                                    </div>
                                </div>

                                {product.barcode && (
                                    <div className="flex justify-center mt-4 pt-4 border-t border-slate-50">
                                        <span className="text-[10px] text-slate-400 font-mono tracking-widest">{product.barcode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            <Package className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No products found matching filters.</p>
                        </div>
                    )}
                </div>

            </>

            {/* Stock Out Modal Popup */}
            {
                selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-lg text-slate-800">Deduct Stock / Sale</h3>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleStockOut}>
                                <div className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100/50 px-6 py-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-slate-900">{selectedProduct.name}</h3>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${selectedProduct.itemType === 'Group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {selectedProduct.itemType}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-mono bg-white/60 inline-block px-2 py-0.5 rounded">{selectedProduct.barcode}</p>
                                        </div>
                                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-rose-100 text-right">
                                            <p className="text-[10px] font-semibold text-rose-600 uppercase tracking-wide mb-0.5">Available</p>
                                            <p className="text-base font-bold text-slate-900">{selectedProduct.quantity} <span className="text-xs font-medium text-slate-600">units</span></p>
                                            <p className="text-xs text-slate-500">({selectedProduct.weight}g)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deduct Quantity</label>
                                            <input
                                                type="number"
                                                className="w-full text-base font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                                required
                                                min="1"
                                                max={selectedProduct.quantity}
                                                value={form.quantity}
                                                onChange={e => handleQuantityChange(parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                                                Weight (g)
                                                <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1"><Scale size={10} /> Auto</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full text-base font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                                step="0.001"
                                                required
                                                value={form.weight}
                                                onChange={e => setForm({ ...form, weight: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason</label>
                                        <select
                                            value={form.reason}
                                            onChange={e => setForm({ ...form, reason: e.target.value as StockReason })}
                                            className="w-full text-sm font-medium p-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                        >
                                            <option value="Sale">Sale (Sold)</option>
                                            <option value="Damage">Damage / Scrap</option>
                                            <option value="Transfer">Transfer to other Store</option>
                                        </select>
                                    </div>

                                    {form.quantity > selectedProduct.quantity && (
                                        <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2 border border-rose-200 text-sm">
                                            <AlertTriangle size={16} />
                                            <span className="font-semibold">Insufficient Stock!</span>
                                        </div>
                                    )}

                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-4 border border-slate-200/60">
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm text-slate-700">
                                                Deducting <span className="font-bold text-rose-600">{form.quantity}</span> units, <span className="font-bold text-rose-600">{form.weight}g</span>
                                            </div>
                                            <button
                                                type="submit"
                                                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-md shadow-rose-600/20 transition-all hover:shadow-lg active:scale-95 flex items-center gap-2"
                                            >
                                                <ArrowUpFromLine size={16} /> Confirm
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default StockOut;
