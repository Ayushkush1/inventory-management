import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import type { Product, MetalType } from '../../types';
import { Plus, Search, Barcode, X, Save, Printer, Trash2, Pencil, CircleCheck } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { useReactToPrint } from 'react-to-print';
import Toast from '../../components/ui/Toast';

const Products = () => {
    const { products, categories, subCategories, addProduct, updateProduct, metalRates, deleteProduct, addCategory, addSubCategory } = useInventory();
    const [searchParams, setSearchParams] = useSearchParams();

    // View State
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Printing & Modals
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; productId: string | null }>({ isOpen: false, productId: null });
    const [lastSavedProduct, setLastSavedProduct] = useState<any>(null); // specific type or any for form data
    const [printData, setPrintData] = useState<any>(null); // Product to print



    // Form State
    const initialFormState = {
        name: '',
        categoryId: '',
        subCategoryId: '',
        itemType: 'Individual' as 'Individual' | 'Group',
        weight: '',
        quantity: 1,
        makingCharge: '',
        makingChargeType: 'per_gram' as 'per_gram' | 'per_piece',
        profitPercent: 10,
        hsnCode: '',
        barcode: '',
        sku: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [categoryInput, setCategoryInput] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [subCategoryInput, setSubCategoryInput] = useState('');
    const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);
    const [newCategoryType, setNewCategoryType] = useState<MetalType>('Gold');

    const canvasRef = useRef<HTMLCanvasElement>(null); // For Form Barcode
    const labelCanvasRef = useRef<HTMLCanvasElement>(null); // For Hidden Print Label Barcode
    const labelPrintRef = useRef<HTMLDivElement>(null);

    // Handle URL Params
    useEffect(() => {
        if (searchParams.get('mode') === 'add') {
            resetForm();
            setView('form');
            generateBarcode(true);
        }
    }, [searchParams]);

    // Generate Barcode
    const generateBarcode = (force = false) => {
        if (!formData.barcode || force) {
            const code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            setFormData(prev => ({ ...prev, barcode: code, sku: `SKU-${code.slice(-4)}` }));
        }
    };

    // Auto-render barcode ON FORM
    useEffect(() => {
        if (view === 'form' && formData.barcode && canvasRef.current) {
            try {
                JsBarcode(canvasRef.current, formData.barcode, {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true
                });
            } catch (e) { console.error(e); }
        }
    }, [formData.barcode, view]);

    // Render barcode for PRINTING when printData changes
    useEffect(() => {
        if (printData && labelCanvasRef.current) {
            try {
                JsBarcode(labelCanvasRef.current, printData.barcode, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: false, // Don't show value on canvas, we display it separately
                    margin: 0
                });
            } catch (e) { console.error(e); }
        }
    }, [printData]);

    // Print Function
    const triggerPrint = useReactToPrint({
        contentRef: labelPrintRef,
        documentTitle: printData ? `Label-${printData.barcode}` : 'Label',
    });

    const handlePrintRequest = (product: any) => {
        setPrintData(product);
        setTimeout(() => {
            triggerPrint();
        }, 100);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setCategoryInput('');
        setSubCategoryInput('');
        setNewCategoryType('Gold');
        setEditingId(null);
    };

    const handleEdit = (product: Product) => {
        const cat = categories.find(c => c.id === product.categoryId);
        const sub = subCategories.find(s => s.id === product.subCategoryId);

        setFormData({
            ...product,
            weight: product.weight.toString(),
            quantity: product.quantity,
            makingCharge: product.makingCharge.toString(),
            makingChargeType: product.makingChargeType,
            hsnCode: product.hsnCode || '',
        });
        setCategoryInput(cat ? cat.name : '');
        setSubCategoryInput(sub ? sub.name : '');
        setEditingId(product.id);
        setView('form');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Handle Dynamic Category
        let finalCategoryId = formData.categoryId;
        if (!finalCategoryId && categoryInput.trim()) {
            const trimmedInput = categoryInput.trim();
            const existingCat = categories.find(c => c.name.toLowerCase() === trimmedInput.toLowerCase());

            if (existingCat) {
                finalCategoryId = existingCat.id;
            } else {
                // Create New Category
                finalCategoryId = addCategory({ name: trimmedInput, type: newCategoryType });
            }
        }

        if (!finalCategoryId) return; // Should usually be prevented by required field, but safety check

        // 2. Handle Dynamic SubCategory
        let finalSubCategoryId = formData.subCategoryId;
        // Logic: Only try to find/create subcat if user typed something
        if (subCategoryInput.trim()) {
            const trimmedSub = subCategoryInput.trim();
            const existingSub = subCategories.find(s => s.categoryId === finalCategoryId && s.name.toLowerCase() === trimmedSub.toLowerCase());

            if (existingSub) {
                finalSubCategoryId = existingSub.id;
            } else {
                finalSubCategoryId = addSubCategory({ name: trimmedSub, categoryId: finalCategoryId });
            }
        } else {
            finalSubCategoryId = '';
        }

        const productData = {
            ...formData,
            categoryId: finalCategoryId,
            subCategoryId: finalSubCategoryId,
            weight: Number(formData.weight),
            quantity: Number(formData.quantity),
            makingCharge: Number(formData.makingCharge),
            profitPercent: Number(formData.profitPercent)
        };

        if (editingId) {
            updateProduct(editingId, productData);
            setNotification({ message: 'Product Updated Successfully', type: 'success' });
            setView('list');
            resetForm();
        } else {
            addProduct(productData);
            setLastSavedProduct(productData);
            setShowSuccessModal(true);
            setView('list');
            resetForm();
            generateBarcode(true);
        }
    };

    const calculatePrice = (product: Product) => {
        const cat = categories.find(c => c.id === product.categoryId);
        const rate = cat?.type === 'Gold' ? metalRates.goldRate : metalRates.silverRate;
        const baseCost = (rate * product.weight);
        const making = product.makingChargeType === 'per_gram'
            ? product.makingCharge * product.weight
            : product.makingCharge * product.quantity;
        const cost = baseCost + making;
        const sp = cost * (1 + product.profitPercent / 100);
        return sp;
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
    );

    return (
        <div className="animate-fade-in pb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-0 bg-blue-100 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 flex items-center p-0.5 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                        <Search className="text-slate-400 ml-3" size={18} />
                        <input
                            type="text"
                            className="w-full pl-2 pr-4 py-2 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-sm font-medium"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    onClick={() => { resetForm(); setView('form'); generateBarcode(true); }}
                >
                    <Plus size={18} />
                    <span>Add Product</span>
                </button>
            </div>

            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-scale-up">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CircleCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Product Saved!</h3>
                        <p className="text-slate-500 mb-8">Item has been added to inventory.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePrintRequest(lastSavedProduct)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Printer size={20} /> Print Barcode
                            </button>
                            <button
                                onClick={() => { setShowSuccessModal(false); setView('form'); }}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                            >
                                Add Another
                            </button>
                            <button
                                onClick={() => { setShowSuccessModal(false); setView('list'); }}
                                className="w-full py-3 bg-transparent hover:bg-slate-50 text-slate-500 rounded-xl font-bold transition-colors"
                            >
                                Close & View List
                            </button>
                        </div>
                    </div >
                </div >
            )}

            {/* Product List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Weight</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Qty</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right hidden lg:table-cell">M. Charge</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Est. Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const category = categories.find(c => c.id === product.categoryId);
                                    const subCategory = subCategories.find(s => s.id === product.subCategoryId);
                                    const isGold = category?.type === 'Gold';

                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-bold text-slate-900 line-clamp-1 max-w-[180px]" title={product.name}>
                                                            {product.name}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${product.itemType === 'Individual'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                            : 'bg-purple-50 text-purple-600 border-purple-100'
                                                            }`}>
                                                            {product.itemType === 'Individual' ? 'IND' : 'GRP'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                        <Barcode size={12} className="opacity-50" />
                                                        {product.barcode}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-inset ${isGold
                                                        ? 'bg-amber-50 text-amber-700 ring-amber-100'
                                                        : 'bg-slate-50 text-slate-600 ring-slate-100'
                                                        }`}>
                                                        {isGold ? 'Au' : 'Ag'}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-700">{category?.name}</span>
                                                        <span className="text-xs text-slate-400">{subCategory?.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-bold text-slate-700">{product.weight}</span>
                                                <span className="text-xs text-slate-400 ml-0.5">gm</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[30px] h-6 px-2 rounded text-xs font-medium border ${product.quantity <= 2
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}>
                                                    {product.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right hidden lg:table-cell">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-medium text-slate-600">
                                                        ₹{product.makingCharge}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 capitalize">
                                                        {product.makingChargeType.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(calculatePrice(product))}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {product.profitPercent}% margin
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handlePrintRequest(product)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                                                        title="Print Label"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors group/btn"
                                                        title="Edit Product"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmation({ isOpen: true, productId: product.id })}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group/btn"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search size={48} className="text-slate-200 mb-4" />
                                            <p className="text-lg font-medium text-slate-900">No products found</p>
                                            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or add a new product.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Form Modal */}
            {view === 'form' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up">
                        <div className="flex-none px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={() => { setView('list'); setSearchParams({}); resetForm(); }}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="product-form" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column: Core Identity */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Type</label>
                                            <div className="flex gap-4">
                                                <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${formData.itemType === 'Individual' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                                    <input type="radio" name="itemType" value="Individual" className="hidden"
                                                        checked={formData.itemType === 'Individual'}
                                                        onChange={() => setFormData({ ...formData, itemType: 'Individual', quantity: 1 })}
                                                    />
                                                    <span className="font-bold text-sm">Individual</span>
                                                </label>
                                                <label className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${formData.itemType === 'Group' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                                    <input type="radio" name="itemType" value="Group" className="hidden"
                                                        checked={formData.itemType === 'Group'}
                                                        onChange={() => setFormData({ ...formData, itemType: 'Group' })}
                                                    />
                                                    <span className="font-bold text-sm">Packet/Group</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Category & Sub-Category</label>
                                            <div className="grid grid-cols-2 gap-3 z-20 relative">
                                                {/* Category Input */}
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                                        placeholder="Select or Type Category"
                                                        value={categoryInput}
                                                        onFocus={() => setIsCategoryOpen(true)}
                                                        onBlur={() => setTimeout(() => setIsCategoryOpen(false), 200)}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setCategoryInput(val);
                                                            setIsCategoryOpen(true);
                                                            const match = categories.find(c => c.name.toLowerCase() === val.toLowerCase());
                                                            setFormData(prev => ({ ...prev, categoryId: match ? match.id : '' }));
                                                        }}
                                                    />
                                                    {isCategoryOpen && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 animate-fade-in">
                                                            {categories.filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase())).length > 0 ? (
                                                                categories
                                                                    .filter(c => c.name.toLowerCase().includes(categoryInput.toLowerCase()))
                                                                    .map(c => (
                                                                        <div
                                                                            key={c.id}
                                                                            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center"
                                                                            onMouseDown={() => {
                                                                                setCategoryInput(c.name);
                                                                                setFormData(prev => ({ ...prev, categoryId: c.id }));
                                                                                setIsCategoryOpen(false);
                                                                            }}
                                                                        >
                                                                            <span className="font-bold">{c.name}</span>
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.type === 'Gold' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{c.type}</span>
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                categoryInput && (
                                                                    <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                                                                        Press enter or click outside to create "{categoryInput}"
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* SubCategory Input */}
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                                        placeholder="Sub Category (Optional)"
                                                        value={subCategoryInput}
                                                        onFocus={() => setIsSubCategoryOpen(true)}
                                                        onBlur={() => setTimeout(() => setIsSubCategoryOpen(false), 200)}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setSubCategoryInput(val);
                                                            setIsSubCategoryOpen(true);
                                                            const match = subCategories.find(s => s.name.toLowerCase() === val.toLowerCase() && s.categoryId === formData.categoryId);
                                                            setFormData(prev => ({ ...prev, subCategoryId: match ? match.id : '' }));
                                                        }}
                                                    />
                                                    {isSubCategoryOpen && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 animate-fade-in">
                                                            {subCategories
                                                                .filter(s => (!formData.categoryId || s.categoryId === formData.categoryId) && s.name.toLowerCase().includes(subCategoryInput.toLowerCase()))
                                                                .length > 0 ? (
                                                                subCategories
                                                                    .filter(s => (!formData.categoryId || s.categoryId === formData.categoryId) && s.name.toLowerCase().includes(subCategoryInput.toLowerCase()))
                                                                    .map(s => (
                                                                        <div
                                                                            key={s.id}
                                                                            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none"
                                                                            onMouseDown={() => {
                                                                                setSubCategoryInput(s.name);
                                                                                setFormData(prev => ({ ...prev, subCategoryId: s.id }));
                                                                                setIsSubCategoryOpen(false);
                                                                            }}
                                                                        >
                                                                            {s.name}
                                                                        </div>
                                                                    ))
                                                            ) : (
                                                                subCategoryInput && (
                                                                    <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                                                                        New subcategory will be created
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* New Category Type Selector */}
                                            {!formData.categoryId && categoryInput.length > 1 && (
                                                <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-3 animate-fade-in">
                                                    <span className="text-xs font-bold text-amber-700">New Category Type:</span>
                                                    <div className="flex gap-2">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="radio" name="newCatType" className="accent-amber-600" checked={newCategoryType === 'Gold'} onChange={() => setNewCategoryType('Gold')} />
                                                            <span className="text-xs font-medium text-amber-900">Gold</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="radio" name="newCatType" className="accent-slate-600" checked={newCategoryType === 'Silver'} onChange={() => setNewCategoryType('Silver')} />
                                                            <span className="text-xs font-medium text-slate-700">Silver</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Product Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                                                placeholder="e.g. Gold Ring 22k Design A"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">HSN Code</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    value={formData.hsnCode}
                                                    onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                {/* Placeholder */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Weight & Pricing */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Weight (g)</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    required
                                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base"
                                                    value={formData.weight}
                                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base ${formData.itemType === 'Individual' ? 'cursor-not-allowed opacity-60' : ''}`}
                                                    value={formData.quantity}
                                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                                    readOnly={formData.itemType === 'Individual'}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                            <h4 className="font-bold text-slate-600 text-sm uppercase">Pricing Details</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Making Charge</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                                                        value={formData.makingCharge}
                                                        onChange={e => setFormData({ ...formData, makingCharge: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                                    <select
                                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                                                        value={formData.makingChargeType}
                                                        onChange={e => setFormData({ ...formData, makingChargeType: e.target.value as any })}
                                                    >
                                                        <option value="per_gram">Per Gram</option>
                                                        <option value="per_piece">Per Piece</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Profit (%)</label>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
                                                    value={formData.profitPercent}
                                                    onChange={e => setFormData({ ...formData, profitPercent: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        {/* Barcode Preview */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-bold text-slate-700">Barcode (Auto)</label>
                                                {!editingId && (
                                                    <button type="button" onClick={() => generateBarcode(true)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                                        <Barcode size={14} /> Regenerate
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <div className="relative w-full">
                                                    <div className="h-[60px] bg-white border border-slate-200 rounded-xl px-2 flex items-center justify-center overflow-hidden">
                                                        {formData.barcode ? (
                                                            <canvas ref={canvasRef} id="barcode-canvas" className="max-h-full"></canvas>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">Barcode will appear here</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="flex-none p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => { setView('list'); setSearchParams({}); resetForm(); }}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="product-form"
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-500/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <Save size={16} /> {editingId ? 'Update Product' : 'Save Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-up text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Product?</h3>
                        <p className="text-slate-500 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, productId: null })}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (deleteConfirmation.productId) {
                                        deleteProduct(deleteConfirmation.productId);
                                        setDeleteConfirmation({ isOpen: false, productId: null });
                                        setNotification({ message: 'Product Deleted Successfully', type: 'success' });
                                    }
                                }}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Component - Dynamic */}
            <div style={{ display: 'none' }}>
                <div ref={labelPrintRef} className="p-4 bg-white text-center">
                    {printData && (
                        <div style={{ width: '200px', border: '1px solid black', padding: '5px', margin: '0 auto', textAlign: 'center' }}>
                            <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {printData.name} - {printData.weight}g - {categories.find(c => c.id === printData.categoryId)?.name}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
                                <canvas ref={labelCanvasRef} style={{ height: '40px', maxWidth: '100%' }}></canvas>
                            </div>
                            <p style={{ margin: '0', fontSize: '10px', fontFamily: 'monospace' }}>{printData.barcode}</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
export default Products;
