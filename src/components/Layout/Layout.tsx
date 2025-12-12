
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';


const Layout = () => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-900 pt-3 px-3 gap-3">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full bg-slate-50 rounded-t-[30px] overflow-hidden relative shadow-2xl shadow-black/20">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth scrollbar-thin">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
