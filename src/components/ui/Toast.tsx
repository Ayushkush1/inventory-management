import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
            >
                {type === 'success' ? (
                    <CheckCircle size={20} className="text-emerald-600" />
                ) : (
                    <AlertCircle size={20} className="text-rose-600" />
                )}
                <p className="font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-2 p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
