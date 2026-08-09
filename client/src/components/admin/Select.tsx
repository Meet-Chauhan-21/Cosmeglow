import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  hClass?: string; // custom height class, e.g. "h-10" or "h-12"
  buttonClassName?: string; // custom button styling
  placement?: 'bottom' | 'top';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  error = false,
  disabled = false,
  className = '',
  hClass = 'h-11',
  buttonClassName = '',
  placement = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative ${className ? className : 'w-full'}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 border rounded-xl transition-all duration-200 cursor-pointer text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-650/5 ${hClass} ${
          disabled
            ? 'opacity-55 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
            : error
            ? 'border-red-500 focus:border-red-500'
            : isOpen
            ? 'border-indigo-500 ring-4 ring-indigo-500/5 bg-white'
            : buttonClassName
            ? buttonClassName
            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
        }`}
      >
        <span className={selectedOption ? (buttonClassName ? 'font-semibold' : 'text-slate-800 font-medium') : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${buttonClassName ? 'text-current' : 'text-slate-400'}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: placement === 'top' ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === 'top' ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1.5 font-sans"
            style={
              placement === 'top'
                ? {
                    bottom: `${coords.bottom + 6}px`,
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                  }
                : {
                    top: `${coords.top + 6}px`,
                    left: `${coords.left}px`,
                    width: `${coords.width}px`,
                  }
            }
          >
            {options.length === 0 ? (
              <div className="px-4 py-2 text-xs text-slate-400">No options available</div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                      isSelected
                        ? 'text-indigo-600 bg-indigo-50/30 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-indigo-650" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;
