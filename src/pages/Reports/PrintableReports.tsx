
import React from 'react';
import type { Product, StockTransaction, Category } from '../../types';

interface StockReportProps {
    products: Product[];
    categories: Category[];
    title?: string;
}

export const StockReportPrintable = React.forwardRef<HTMLDivElement, StockReportProps>((props, ref) => {
    const { products, categories, title } = props;
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div ref={ref} className="p-8 bg-white text-black font-serif w-full max-w-[210mm] mx-auto hidden print:block">
            <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{title || 'Stock Summary Report'}</h1>
                <p className="text-sm text-slate-600">{date}</p>
            </div>

            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Product</th>
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Category</th>
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Type</th>
                        <th className="border border-slate-300 p-2 text-right font-bold text-slate-800">Stock Qty</th>
                        <th className="border border-slate-300 p-2 text-right font-bold text-slate-800">Weight (g)</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.id} className="even:bg-slate-50">
                            <td className="border border-slate-300 p-2">{p.name}</td>
                            <td className="border border-slate-300 p-2">{categories.find(c => c.id === p.categoryId)?.name || '-'}</td>
                            <td className="border border-slate-300 p-2">{p.itemType}</td>
                            <td className="border border-slate-300 p-2 text-right">{p.quantity}</td>
                            <td className="border border-slate-300 p-2 text-right">{p.weight}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-300 p-2" colSpan={3}>Totals</td>
                        <td className="border border-slate-300 p-2 text-right text-slate-900">{products.reduce((a, b) => a + b.quantity, 0)}</td>
                        <td className="border border-slate-300 p-2 text-right text-slate-900">{products.reduce((a, b) => a + b.weight, 0).toFixed(3)}g</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});

export const SalesReportPrintable = React.forwardRef<HTMLDivElement, { transactions: StockTransaction[], products: Product[] }>((props, ref) => {
    const { transactions, products } = props;

    return (
        <div ref={ref} className="p-8 bg-white text-black font-serif w-full max-w-[210mm] mx-auto hidden print:block">
            <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Sales & Transaction Log</h1>
                <p className="text-sm text-slate-600">Recent Activity</p>
            </div>

            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Date</th>
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Type</th>
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Product</th>
                        <th className="border border-slate-300 p-2 text-right font-bold text-slate-800">Qty</th>
                        <th className="border border-slate-300 p-2 text-right font-bold text-slate-800">Weight</th>
                        <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(t => (
                        <tr key={t.id} className="even:bg-slate-50">
                            <td className="border border-slate-300 p-2">{new Date(t.date).toLocaleString()}</td>
                            <td className="border border-slate-300 p-2 font-medium">
                                <span className={t.type === 'STOCK_IN' ? 'text-green-700' : 'text-red-700'}>
                                    {t.type.replace('_', ' ')}
                                </span>
                            </td>
                            <td className="border border-slate-300 p-2">{products.find(p => p.id === t.productId)?.name || 'Unknown'}</td>
                            <td className="border border-slate-300 p-2 text-right">{t.quantity}</td>
                            <td className="border border-slate-300 p-2 text-right">{t.weight}</td>
                            <td className="border border-slate-300 p-2">{t.reason || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
