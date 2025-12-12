import { useRef, useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useReactToPrint } from 'react-to-print';
import { Printer, Filter, TrendingUp, Package, PlusCircle, FileText, ArrowRight, Sheet, ChevronDown, Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { StockReportPrintable, SalesReportPrintable } from './PrintableReports';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const Reports = () => {
    const { products, categories, subCategories, transactions, calculatePrice } = useInventory();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'added'>('inventory');
    const [showExportMenu, setShowExportMenu] = useState(false);

    const stockReportRef = useRef<HTMLDivElement>(null);
    const salesReportRef = useRef<HTMLDivElement>(null);
    const addedReportRef = useRef<HTMLDivElement>(null);

    // Filter Logic
    const getFilteredTransactions = () => {
        return transactions.filter(t => {
            if (!dateRange.start && !dateRange.end) return true;
            const tDate = new Date(t.date);
            const start = dateRange.start ? new Date(dateRange.start) : new Date('2000-01-01');
            const end = dateRange.end ? new Date(dateRange.end) : new Date();
            end.setHours(23, 59, 59);
            return tDate >= start && tDate <= end;
        });
    };

    const getFilteredAddedProducts = () => {
        return products.filter(p => {
            if (!dateRange.start && !dateRange.end) return true;
            const pDate = new Date(p.createdAt);
            const start = dateRange.start ? new Date(dateRange.start) : new Date('2000-01-01');
            const end = dateRange.end ? new Date(dateRange.end) : new Date();
            end.setHours(23, 59, 59);
            return pDate >= start && pDate <= end;
        });
    };

    const filteredTransactions = useMemo(() => getFilteredTransactions(), [transactions, dateRange]);
    const filteredAddedProducts = useMemo(() => getFilteredAddedProducts(), [products, dateRange]);

    // Stats Calculation
    const stats = useMemo(() => {
        const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);

        const totalGoldWeight = products
            .filter(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                return cat?.type === 'Gold';
            })
            .reduce((acc, p) => acc + p.weight, 0)
            .toFixed(2);

        const totalSilverWeight = products
            .filter(p => {
                const cat = categories.find(c => c.id === p.categoryId);
                return cat?.type === 'Silver';
            })
            .reduce((acc, p) => acc + p.weight, 0)
            .toFixed(2);

        const salesCount = transactions.filter(t => t.type === 'STOCK_OUT').length;

        return { totalItems, totalGoldWeight, totalSilverWeight, salesCount };
    }, [products, transactions, categories]);

    // Chart Data Preparation
    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        products.forEach(p => {
            const catName = categories.find(c => c.id === p.categoryId)?.name || 'Unknown';
            data[catName] = (data[catName] || 0) + p.quantity;
        });
        return Object.keys(data).map(name => ({ name, value: data[name] }));
    }, [products, categories]);

    const salesTrendData = useMemo(() => {
        const data: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'STOCK_OUT').forEach(t => {
            const dateStr = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            data[dateStr] = (data[dateStr] || 0) + t.quantity;
        });
        // Fill in gaps or sort? For now just map and sort by simplified logic or keep as is if chronological
        // Simple chronological sort might be needed if date format varies, but let's trust filteredTransactions order if mostly sorted, or simple sort
        return Object.keys(data).map(date => ({ date, sales: data[date] }));
    }, [filteredTransactions]);

    const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899'];




    const handlePrintStock = useReactToPrint({
        contentRef: stockReportRef,
        documentTitle: 'Stock_Report'
    });

    const handlePrintSales = useReactToPrint({
        contentRef: salesReportRef,
        documentTitle: 'Sales_Report'
    });

    const handlePrintAdded = useReactToPrint({
        contentRef: addedReportRef,
        documentTitle: 'Added_Items_Report'
    });

    const handleExportExcel = () => {
        let data: any[] = [];
        let fileName = 'Report';

        if (activeTab === 'inventory') {
            fileName = 'Comprehensive_Stock_Report';
            data = products.map(p => {
                // Calculate Sold Data
                const productSales = transactions
                    .filter(t => t.productId === p.id && t.type === 'STOCK_OUT')
                    .reduce((acc, t) => ({
                        quantity: acc.quantity + t.quantity,
                        weight: acc.weight + t.weight
                    }), { quantity: 0, weight: 0 });

                // Calculate Total Data
                const totalStats = {
                    quantity: p.quantity + productSales.quantity,
                    weight: p.weight + productSales.weight
                };

                return {
                    'Product Name': p.name,
                    'Barcode': p.barcode,
                    'Category': categories.find(c => c.id === p.categoryId)?.name,
                    'Type': p.itemType,
                    'Current Qty': p.quantity,
                    'Current Wt (g)': p.weight,
                    'Sold Qty': productSales.quantity,
                    'Sold Wt (g)': productSales.weight,
                    'Total Qty': totalStats.quantity,
                    'Total Wt (g)': totalStats.weight,
                    'Added Date': new Date(p.createdAt).toLocaleDateString()
                };
            });
        } else if (activeTab === 'sales') {
            fileName = 'Sales_Report';
            data = filteredTransactions.map(t => {
                const p = products.find(prod => prod.id === t.productId);
                return {
                    'Date': new Date(t.date).toLocaleDateString(),
                    'Time': new Date(t.date).toLocaleTimeString(),
                    'Type': t.type,
                    'Product Name': p?.name || 'Deleted Product',
                    'Barcode': p?.barcode || '-',
                    'Quantity': t.quantity,
                    'Weight (g)': t.weight,
                    'Reason': t.reason
                };
            });
        } else if (activeTab === 'added') {
            fileName = 'New_Items_Report';
            data = filteredAddedProducts.map(p => ({
                'Product Name': p.name,
                'Barcode': p.barcode,
                'Category': categories.find(c => c.id === p.categoryId)?.name,
                'Type': p.itemType,
                'Quantity': p.quantity,
                'Weight (g)': p.weight,
                'Added Date': new Date(p.createdAt).toLocaleDateString()
            }));
        }

        const ws = utils.json_to_sheet(data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Report");
        writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="animate-fade-in pb-12">


            {/* Stats Overview Cards (Clean UI) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Inventory</p>
                            <h3 className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{stats.totalItems}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">Items</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Gold Stock</p>
                            <h3 className="text-3xl font-bold text-slate-800 group-hover:text-amber-500 transition-colors">{stats.totalGoldWeight}<span className="text-lg text-slate-400 font-normal ml-1">g</span></h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">Pure Gold</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Silver Stock</p>
                            <h3 className="text-3xl font-bold text-slate-800 group-hover:text-slate-500 transition-colors">{stats.totalSilverWeight}<span className="text-lg text-slate-400 font-normal ml-1">g</span></h3>
                        </div>
                        <div className="p-3 bg-slate-100 text-slate-500 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">Fine Silver</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Total Sales</p>
                            <h3 className="text-3xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{stats.salesCount}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">Transactions</span>
                    </div>
                </div>
            </div>

            {/* Business Intelligence Section */}
            {/* Analytics Grid: Sales & Categories Side-by-Side */}
            {(activeTab === 'sales' || activeTab === 'inventory') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                    {/* 1. Sales Performance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp size={18} className="text-emerald-500" /> Daily Sales Trend
                            </h3>
                        </div>

                        <div className="flex flex-col gap-6 flex-1 min-h-[300px]">
                            {/* Chart */}
                            <div className="flex-1 w-full min-h-0">
                                {salesTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesTrendData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6} />
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} stroke="#94a3b8" />
                                            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-xs font-medium">No sales data in this period</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>


                    {/* 2. Category Analysis */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <Package size={18} className="text-blue-500" /> Category Breakdown
                        </h3>
                        <div className="flex flex-col flex-1 min-h-[300px]">
                            {/* Chart */}
                            <div className="flex-1 w-full relative min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}
                                        />
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                                            formatter={(value, entry: any) => (
                                                <span className="text-slate-600 font-semibold">
                                                    {value} <span className="text-slate-400 font-normal ml-1">({entry.payload.value})</span>
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Central Total Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4 pr-20">
                                    <div className="text-2xl font-bold text-slate-800">{stats.totalItems}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Items</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Controls & Filters */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-6">

                {/* Custom Tabs */}
                <div className="flex bg-white/5 p-1.5 rounded-xl gap-1">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <Package size={16} /> Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <TrendingUp size={16} /> Sales History
                    </button>
                    <button
                        onClick={() => setActiveTab('added')}
                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'added' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                        <PlusCircle size={16} /> New Items
                    </button>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl">
                    <Filter size={16} className="text-slate-500" />
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Date Range</span>
                    <div className="h-4 w-px bg-slate-300 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    {/* Clear Button */}
                    {(dateRange.start || dateRange.end) && (
                        <button
                            onClick={() => setDateRange({ start: '', end: '' })}
                            className="ml-2 text-xs text-rose-500 font-bold hover:text-rose-600 px-2 py-1 bg-rose-50 rounded-md transition-colors"
                        >
                            CLEAR
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {/* Table Header Action */}
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                            {activeTab === 'inventory' && 'Current Stock Inventory'}
                            {activeTab === 'sales' && 'Transaction History'}
                            {activeTab === 'added' && 'Newly Added Items Log'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Viewing data for {dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'all time period'}
                        </p>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="text-sm bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-slate-200 hover:shadow-lg active:scale-95"
                        >
                            <Download size={16} />
                            <span>Download Report</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in">
                                <button
                                    onClick={() => {
                                        if (activeTab === 'inventory') handlePrintStock();
                                        if (activeTab === 'sales') handlePrintSales();
                                        if (activeTab === 'added') handlePrintAdded();
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-50"
                                >
                                    <Printer size={16} className="text-blue-500" /> Print / PDF
                                </button>
                                <button
                                    onClick={() => {
                                        handleExportExcel();
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                    <Sheet size={16} className="text-emerald-500" /> Export Excel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 tracking-wide uppercase text-xs">
                            {activeTab === 'sales' ? (
                                <tr>
                                    <th className="p-5">Date</th>
                                    <th className="p-5">Type</th>
                                    <th className="p-5">Product Details</th>
                                    <th className="p-5 text-right">Qty</th>
                                    <th className="p-5 text-right">Weight</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="p-5">Product Details</th>
                                    <th className="p-5">Category & Meta</th>
                                    <th className="p-5">Financials</th>
                                    <th className="p-5 text-right text-emerald-700 bg-emerald-50/20">Current Stock</th>
                                    <th className="p-5 text-right text-rose-700 bg-rose-50/20">Sold Units</th>
                                    <th className="p-5 text-right text-slate-700 bg-slate-50/50">Total Added</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* COMPREHENSIVE STOCK REPORT Rows (Combined Inventory + Sales) */}
                            {activeTab === 'inventory' && products.map(p => {
                                // Calculate Solde Data for this product
                                const productSales = transactions
                                    .filter(t => t.productId === p.id && t.type === 'STOCK_OUT')
                                    .reduce((acc, t) => ({
                                        quantity: acc.quantity + t.quantity,
                                        weight: acc.weight + t.weight
                                    }), { quantity: 0, weight: 0 });

                                // Calculate Total (Current + Sold)
                                const totalStats = {
                                    quantity: p.quantity + productSales.quantity,
                                    weight: p.weight + productSales.weight
                                };

                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group border-b border-slate-50 last:border-none">
                                        <td className="p-5">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{p.name}</div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 border ${p.itemType === 'Group' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                    {p.itemType === 'Individual' ? 'Indv' : 'Grp'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                                                <div className="font-mono text-slate-400">BC: {p.barcode}</div>
                                                {p.sku && <div className="font-mono text-slate-400">SKU: {p.sku}</div>}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-medium text-slate-700">
                                                {categories.find(c => c.id === p.categoryId)?.name}
                                                {p.subCategoryId && (
                                                    <span className="text-slate-400 mx-1">›</span>
                                                )}
                                                <span className="text-slate-500 font-normal">
                                                    {subCategories.find(s => s.id === p.subCategoryId)?.name}
                                                </span>
                                            </div>
                                            {p.hsnCode && (
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 px-1.5 py-0.5 bg-slate-100 rounded w-fit">
                                                    HSN: {p.hsnCode}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-bold text-slate-700 mb-1">
                                                ₹{Math.round(calculatePrice(p)).toLocaleString('en-IN')}
                                            </div>
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.status}
                                            </div>
                                        </td>

                                        {/* Current Stock */}
                                        <td className="p-5 text-right bg-emerald-50/30 border-l border-emerald-100/50">
                                            <div className="font-bold text-emerald-700">{p.quantity}</div>
                                            <div className="text-xs text-emerald-600/70">{p.weight}g</div>
                                        </td>

                                        {/* Sold Stats */}
                                        <td className="p-5 text-right bg-rose-50/30 border-l border-rose-100/50">
                                            <div className="font-bold text-rose-700">{productSales.quantity}</div>
                                            <div className="text-xs text-rose-600/70">{productSales.weight.toFixed(2)}g</div>
                                        </td>

                                        {/* Total Stats */}
                                        <td className="p-5 text-right bg-slate-50/50 border-l border-slate-200/50 font-medium">
                                            <div className="font-bold text-slate-800">{totalStats.quantity}</div>
                                            <div className="text-xs text-slate-500">{totalStats.weight.toFixed(2)}g</div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* SALES TAB Rows */}
                            {activeTab === 'sales' && filteredTransactions.map(t => {
                                const p = products.find(prod => prod.id === t.productId);
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5">
                                            <div className="font-medium text-slate-700">{new Date(t.date).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400">{new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex w-fit items-center gap-1.5 ${t.type === 'STOCK_IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                {t.type === 'STOCK_IN' ? <PlusCircle size={12} /> : <ArrowRight size={12} />}
                                                {t.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-5 text-slate-700">
                                            <div className="font-medium">{p?.name || 'Deleted Product'}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{p?.barcode || '-'}</div>
                                        </td>
                                        <td className="p-5 text-right font-bold">{t.quantity}</td>
                                        <td className="p-5 text-right text-slate-600">{t.weight}g</td>
                                    </tr>
                                );
                            })}

                            {/* ADDED ITEMS TAB Rows */}
                            {activeTab === 'added' && filteredAddedProducts.map(p => (
                                <tr key={p.id} className="hover:bg-purple-50/30 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-700 group-hover:text-purple-700 transition-colors">{p.name}</div>
                                        <div className="text-xs font-mono text-slate-400 mt-0.5">{p.barcode}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Added: {new Date(p.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-5 text-slate-600">{categories.find(c => c.id === p.categoryId)?.name}</td>
                                    <td className="p-5">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${p.itemType === 'Group' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{p.itemType}</span>
                                    </td>
                                    <td className="p-5 text-right font-bold text-slate-700">{p.quantity}</td>
                                    <td className="p-5 text-right font-medium text-slate-600">{p.weight} g</td>
                                </tr>
                            ))}

                            {/* Empty States */}
                            {((activeTab === 'inventory' && products.length === 0) ||
                                (activeTab === 'sales' && filteredTransactions.length === 0) ||
                                (activeTab === 'added' && filteredAddedProducts.length === 0)) && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center opacity-60">
                                                <FileText size={48} className="mb-4 text-slate-300" />
                                                <p className="text-lg font-medium text-slate-500">No records found</p>
                                                <p className="text-sm">Try adjusting your filters or adding new data.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* Hidden Printable Components */}
            < div style={{ display: 'none' }}>
                <StockReportPrintable ref={stockReportRef} products={products} categories={categories} />
                <SalesReportPrintable ref={salesReportRef} transactions={filteredTransactions} products={products} />
                <StockReportPrintable ref={addedReportRef} products={filteredAddedProducts} categories={categories} title={`New Items Report (${dateRange.start || 'All'} - ${dateRange.end || 'Now'})`} />
            </div >
        </div >
    );
};
export default Reports;
