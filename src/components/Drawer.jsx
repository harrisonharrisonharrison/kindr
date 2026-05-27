import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children }) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-[#141417] border-l border-[#27272a]/35 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 text-[#f3f4f6]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#27272a]/35 bg-[#0e0e11]/80 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#27272a] text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
