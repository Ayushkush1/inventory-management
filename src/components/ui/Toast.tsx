import React, { useEffect } from 'react';
import { CircleCheck, X, AlertCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl border backdrop-blur-md animate-scale-up ${type === 'success' ? 'bg-emerald-900/90 border-emerald-800 text-white' : 'bg-rose-900/90 border-rose-800 text-white'
            }`}>
            {type === 'success' ? <CircleCheck size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-rose-400" />}
            <span className="font-medium text-sm pr-2">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors">
                <X size={14} className="text-white/70" />
            </button>
        </div>
    );
};

export default Toast;
