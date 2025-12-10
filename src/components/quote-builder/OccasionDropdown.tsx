"use client";

import React, { useState, useRef, useEffect } from 'react';

interface OccasionOption {
  value: string;
  label: string;
}

const OCCASIONS: OccasionOption[] = [
  { value: "rectWsASB9PY6fyEq", label: "ראש השנה" },
  { value: "recO7SzRs1SKMbNBC", label: "פורים" },
  { value: "recaDgauTOXn7w4Nx", label: "פסח" },
  { value: "recNYh9ed83Egeo65", label: "חנוכה" },
  { value: "rec9FyBJbUkWfKsIL", label: "סוכות" },
  { value: "recr1ngO8tEBIZ7K8", label: "שבועות" },
  { value: "recc7U8R7tpBIZx9X", label: "טו בשבט" },
  { value: "recNmz8NAS7IuPpXO", label: "יום העצמאות" },
  { value: "recLfm8AIVEIYnyfn", label: "יום האישה" },
  { value: "recULNDIjkufHCuJL", label: "יום המשפחה" },
  { value: "rec5P6ExjDoGomtxw", label: "סוף שנת הלימודים" },
  { value: "recR8jumCdC9ZkrUi", label: "סוף שנה 24" },
  { value: "recyj6WanHD0SDC89", label: "חורף" },
  { value: "recJ6M8IOXIum92kw", label: "קיץ" },
  { value: "recFVAZykn7FW3XPJ", label: "כנסים" },
  { value: "rec9xYom2liLvST0m", label: "שוטף" },
  { value: "recni31KFrnvRPji9", label: "2025" },
  { value: "recgHIav37gXXBUhJ", label: "כללי" },
  { value: "recAJxckkXRiwuUyY", label: "להשלים" },
];

interface OccasionDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function OccasionDropdown({ value, onChange }: OccasionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // סגור dropdown כשלוחצים מחוץ לו
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const filteredOptions = OCCASIONS.filter(option =>
    option.label.includes(searchTerm)
  );

  const getSelectedLabels = () => {
    if (value.length === 0) return 'בחר מועדים';
    
    // הצג את כל המועדים שנבחרו
    const selectedLabels = value
      .map(v => OCCASIONS.find(o => o.value === v)?.label)
      .filter(Boolean)
      .join(', ');
    
    return selectedLabels || 'בחר מועדים';
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">מועד</label>
      <div className="relative" ref={dropdownRef}>
        {/* כפתור הפתיחה */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-sm text-right border border-gray-300 rounded-md bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        >
          <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {getSelectedLabels()}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
            {/* חיפוש */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="חפש מועד..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* רשימת אפשרויות */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  לא נמצאו תוצאות
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2 ml-2"
                    />
                    <span className="text-sm text-gray-900">{option.label}</span>
                  </label>
                ))
              )}
            </div>

            {/* כפתורי פעולה */}
            {value.length > 0 && (
              <div className="p-2 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  נקה הכל ({value.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
