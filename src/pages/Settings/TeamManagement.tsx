import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { Users, Plus, X, Save, Trash2, Shield, Eye, EyeOff, Pencil } from 'lucide-react';
import Toast from '../../components/ui/Toast';
import type { User, Permission } from '../../types';

const TeamManagement = () => {
    const { currentUser } = useAuth();
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        permissions: ['VIEW_INVENTORY', 'MANAGE_STOCK'] as Permission[],
    });

    const availablePermissions: { value: Permission; label: string; description: string }[] = [
        { value: 'VIEW_INVENTORY', label: 'View Inventory', description: 'Can view all products and inventory' },
        { value: 'MANAGE_STOCK', label: 'Manage Stock', description: 'Can perform stock in/out operations' },
        { value: 'VIEW_REPORTS', label: 'View Reports', description: 'Can access reports and analytics' },
        { value: 'UPDATE_METAL_RATES', label: 'Update Metal Rates', description: 'Can update gold and silver rates' },
    ];

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        if (!currentUser?.shopId) return;

        setIsLoading(true);
        try {
            const members = await userAPI.getShopUsers(currentUser.shopId);
            // Filter to show only shop managers
            setTeamMembers(members.filter(m => m.role === 'SHOP_MANAGER'));
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to load team members', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateManager = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser?.shopId) {
            setNotification({ message: 'Shop ID not found', type: 'error' });
            return;
        }

        try {
            await userAPI.createShopManager({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                shopId: currentUser.shopId,
                permissions: formData.permissions,
            });

            setNotification({ message: 'Shop Manager created successfully!', type: 'success' });
            setShowCreateModal(false);
            setFormData({ name: '', email: '', password: '', permissions: ['VIEW_INVENTORY', 'MANAGE_STOCK'] });
            loadTeamMembers();
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to create manager', type: 'error' });
        }
    };

    const handleDeleteManager = async (id: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        try {
            await userAPI.deleteUser(id);
            setNotification({ message: 'Team member removed successfully', type: 'success' });
            loadTeamMembers();
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to remove team member', type: 'error' });
        }
    };

    const togglePermission = (permission: Permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const handleEditMember = (member: User) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            password: '',
            permissions: member.permissions,
        });
        setShowEditModal(true);
    };

    const handleUpdatePermissions = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingMember) return;

        try {
            await userAPI.updateUser(editingMember.id, {
                permissions: formData.permissions,
            });

            setNotification({ message: 'Permissions updated successfully!', type: 'success' });
            setShowEditModal(false);
            setEditingMember(null);
            loadTeamMembers();
        } catch (error: any) {
            setNotification({ message: error.message || 'Failed to update permissions', type: 'error' });
        }
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

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage your shop managers and their permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all"
                >
                    <Plus size={18} />
                    Add Manager
                </button>
            </div>

            {/* Team Members List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : teamMembers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 font-medium">No team members yet</p>
                        <p className="text-slate-400 text-sm mt-1">Add your first shop manager to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Team Member
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Permissions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {teamMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold text-sm">
                                                        {member.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500">Shop Manager</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{member.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.permissions.map((perm) => (
                                                    <span
                                                        key={perm}
                                                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100"
                                                    >
                                                        {perm.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(member.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditMember(member)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit permissions"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteManager(member.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Remove team member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Manager Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users size={20} className="text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Add Shop Manager</h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateManager} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="e.g., John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="manager@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                        placeholder="••••••••"
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Shield size={16} className="inline mr-1" />
                                    Permissions
                                </label>
                                <div className="space-y-2">
                                    {availablePermissions.map((perm) => (
                                        <label
                                            key={perm.value}
                                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm.value)}
                                                onChange={() => togglePermission(perm.value)}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900 text-sm">{perm.label}</div>
                                                <div className="text-xs text-slate-500">{perm.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
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
                                    Create Manager
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Permissions Modal */}
            {showEditModal && editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Shield size={20} className="text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Edit Permissions</h3>
                                    <p className="text-sm text-slate-500">{editingMember.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingMember(null);
                                }}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePermissions} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Shield size={16} className="inline mr-1" />
                                    Permissions
                                </label>
                                <div className="space-y-2">
                                    {availablePermissions.map((perm) => (
                                        <label
                                            key={perm.value}
                                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm.value)}
                                                onChange={() => togglePermission(perm.value)}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900 text-sm">{perm.label}</div>
                                                <div className="text-xs text-slate-500">{perm.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingMember(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Update Permissions
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
