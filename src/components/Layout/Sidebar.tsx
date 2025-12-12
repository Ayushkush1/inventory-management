
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ArrowDownToLine,
    BarChart3,
    Settings,
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: ArrowDownToLine, label: 'Stock', path: '/stock' },
        { icon: BarChart3, label: 'Reports', path: '/reports' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="h-full w-[250px] flex flex-col flex-shrink-0 text-slate-400 pl-2">

            {/* Logo Section */}
            <div className="h-[80px] flex items-center px-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-white tracking-tight block leading-tight">
                            Inventory
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase block">
                            Management
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 flex flex-col gap-2 pt-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => {
                            const baseClasses = 'flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative font-medium';

                            if (isActive) {
                                // Specific active colors or unified sleek look
                                let activeColorClass = 'text-white bg-white/10 shadow-lg shadow-black/5';
                                if (item.path === '/stock') activeColorClass = 'text-blue-400 bg-blue-400/10';

                                return `${baseClasses} ${activeColorClass}`;
                            }

                            return `${baseClasses} hover:bg-white/5 hover:text-slate-200`;
                        }}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
                                    }`} />
                                <span className="text-sm tracking-wide">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Status Footer */}
            <div className="p-4 mt-auto">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">System Status</p>
                    <div className="flex items-center text-sm font-medium text-emerald-400">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Online & Syncing
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
