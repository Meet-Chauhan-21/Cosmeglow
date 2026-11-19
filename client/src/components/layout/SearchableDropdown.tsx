import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

interface SearchableDropdownProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  required = false,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-dark/70 font-display block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border flex items-center justify-between px-4 py-3 text-sm rounded-xl text-left font-sans transition-all shadow-xs cursor-pointer ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-border-gray/50 cursor-not-allowed'
            : hasError
              ? 'border-red-500 bg-light-gray/20 text-dark focus:outline-none focus:ring-1 focus:ring-red-500'
              : 'border-border-gray/80 bg-light-gray/20 text-dark hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary'
        }`}
      >
        <span className={value ? 'text-dark' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute left-0 mt-1.5 w-full bg-white border border-border-gray/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* Search Box */}
          <div className="flex items-center gap-2 border-b border-border-gray/40 px-3 py-2 bg-gray-50">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-sans text-dark bg-transparent focus:outline-none"
            />
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto scrollbar-thin divide-y divide-border-gray/10">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = value === option;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left cursor-pointer transition-colors hover:bg-light-gray/40 font-sans ${
                      isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-dark/80'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={12} className="text-primary" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-400 font-sans">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
