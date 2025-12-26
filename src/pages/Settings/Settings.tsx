import { useState } from 'react';
import { User, Lock, Mail, Phone, Camera, Save, Shield, Layers, Plus, Trash2, ChevronRight, ChevronDown, Package } from 'lucide-react';
import Toast from '../../components/ui/Toast';
import { useInventory } from '../../context/InventoryContext';

import type { MetalType } from '../../types';

const Settings = () => {
    const { categories, subCategories, addCategory, addSubCategory, deleteCategory, deleteSubCategory } = useInventory();


    // Mock Profile State
    const [profile, setProfile] = useState({
        name: 'Admin User',
        email: 'admin@jewellery.com',
        phone: '+91 98765 43210',
        role: 'Super Admin'
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Category Management State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<MetalType>('Gold');
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [newSubCatInputs, setNewSubCatInputs] = useState<{ [key: string]: string }>({});

    const handleProfileUpdate = () => {
        // In a real app, this would make an API call
        setNotification({ message: 'Profile details updated successfully', type: 'success' });
    };

    const handlePasswordUpdate = () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            setNotification({ message: 'Please fill all password fields', type: 'error' });
            return;
        }
        if (passwords.new !== passwords.confirm) {
            setNotification({ message: 'New passwords do not match', type: 'error' });
            return;
        }
        if (passwords.new.length < 6) {
            setNotification({ message: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        // Mock success
        setPasswords({ current: '', new: '', confirm: '' });
        setNotification({ message: 'Password changed successfully', type: 'success' });
    };

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;
        addCategory({ name: newCatName.trim(), type: newCatType });
        setNewCatName('');
        setNotification({ message: 'Category added successfully', type: 'success' });
    };

    const handleAddSubCategory = (categoryId: string) => {
        const name = newSubCatInputs[categoryId]?.trim();
        if (!name) return;

        addSubCategory({ name, categoryId });
        setNewSubCatInputs(prev => ({ ...prev, [categoryId]: '' }));
        setNotification({ message: 'Sub-category added', type: 'success' });
    };

    const handleDeleteCategory = (id: string) => {
        if (confirm('Are you sure? This will delete all subcategories under it.')) {
            deleteCategory(id);
            setNotification({ message: 'Category deleted', type: 'success' });
        }
    };

    return (
        <div className="animate-fade-in pb-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Profile Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Profile Settings</h3>
                            <p className="text-sm text-slate-500">Manage your personal information</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300">
                                <User size={48} />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                            </div>
                        </div>
                        <h4 className="mt-3 font-bold text-slate-700">{profile.name}</h4>
                        <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full mt-1 border border-amber-100">
                            {profile.role}
                        </span>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Full Name</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Phone Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleProfileUpdate}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2"
                            >
                                <Save size={18} /> Update Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Security</h3>
                            <p className="text-sm text-slate-500">Update your account password</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Current Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">New Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handlePasswordUpdate}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Lock size={18} /> Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Management */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Category Management</h3>
                        <p className="text-sm text-slate-500">Add, edit, or remove inventory categories</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Category Form */}
                    <div className="lg:col-span-1 border-b lg:border-r lg:border-b-0 border-slate-100 lg:pr-8 pb-8 lg:pb-0">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-emerald-500" /> Add New Category
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Category Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Diamond Rings"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Metal Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${newCatType === 'Gold' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                        <input type="radio" name="catType" className="hidden" checked={newCatType === 'Gold'} onChange={() => setNewCatType('Gold')} />
                                        <span className="font-bold text-sm">Gold</span>
                                    </label>
                                    <label className={`cursor-pointer p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${newCatType === 'Silver' ? 'border-slate-400 bg-slate-50 text-slate-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                        <input type="radio" name="catType" className="hidden" checked={newCatType === 'Silver'} onChange={() => setNewCatType('Silver')} />
                                        <span className="font-bold text-sm">Silver</span>
                                    </label>
                                </div>
                            </div>
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCatName.trim()}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Plus size={18} /> Create Category
                            </button>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Package size={18} className="text-blue-500" /> Existing Categories
                        </h4>

                        {categories.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                No categories found. Add one to get started.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {categories.map(cat => {
                                    const isExpanded = expandedCat === cat.id;
                                    const subs = subCategories.filter(s => s.categoryId === cat.id);

                                    return (
                                        <div key={cat.id} className={`rounded-xl border transition-all overflow-hidden ${isExpanded ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800">{cat.name}</h5>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${cat.type === 'Gold' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                            {cat.type} • {subs.length} Sub-cats
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Subcategories Panel */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 animate-fade-in border-t border-slate-100 bg-slate-50/50">
                                                    <div className="pt-4 space-y-3">
                                                        {/* List Subs */}
                                                        {subs.length > 0 && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                                {subs.map(sub => (
                                                                    <div key={sub.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg group">
                                                                        <span className="text-sm font-medium text-slate-700 pl-1">{sub.name}</span>
                                                                        <button
                                                                            onClick={() => deleteSubCategory(sub.id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                                                            title="Delete Subcategory"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Add Sub Form */}
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                className="flex-1 p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                placeholder="New Sub-category name"
                                                                value={newSubCatInputs[cat.id] || ''}
                                                                onChange={(e) => setNewSubCatInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(cat.id)}
                                                            />
                                                            <button
                                                                onClick={() => handleAddSubCategory(cat.id)}
                                                                className="px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 text-blue-600 rounded-lg font-bold text-sm transition-all"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {notification && (
                <Toast
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default Settings;
