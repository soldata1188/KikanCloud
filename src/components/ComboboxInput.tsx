'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ComboboxInputProps {
    name: string;
    defaultValue?: string;
    placeholder?: string;
    options: string[];
    required?: boolean;
    className?: string;
}

export function ComboboxInput({ name, defaultValue = '', placeholder, options, required, className }: ComboboxInputProps) {
    const [value, setValue] = useState(defaultValue);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close the dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (option: string) => {
        setValue(option);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                required={required}
                className={`w-full bg-[#fbfcfd] border border-[#ededed] focus:bg-white focus:border-[#24b47e] focus:ring-[3px] focus:ring-[#24b47e]/10 rounded-md px-4 py-3 pr-10 outline-none text-[#1f1f1f] transition-all ${className}`}
                autoComplete="off"
            />

            {/* Custom dropdown arrow to match select appearance */}
            <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer pointer-events-none"
            >
                <ChevronDown size={20} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#ededed] rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className="px-4 py-3 text-sm text-[#1f1f1f] hover:bg-gray-50 cursor-pointer transition-colors"
                            onMouseDown={(e) => {
                                // Prevent input blur from firing before click
                                e.preventDefault();
                                handleOptionClick(option);
                            }}
                        >
                            {option}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            候補がありません
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
