import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "اختر من القائمة",
    isRTL = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div ref={selectRef} className={`relative ${className}`}>
            {/* Select Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                className={`w-full appearance-none bg-white border-2 border-gray-200 
                    hover:border-main/60 focus:border-main focus:shadow-md 
                    text-gray-700 rounded-xl px-4 py-3 text-sm cursor-pointer 
                    transition-all duration-200 focus:outline-none
                    flex items-center justify-between gap-3`}
                dir={isRTL ? "rtl" : "ltr"}
            >
                <span className={`truncate flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {displayText}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute left-0 right-0 mt-2 w-full bg-white 
                        border-2 border-gray-200 rounded-xl shadow-lg z-1000 overflow-hidden"
                    dir={isRTL ? "rtl" : "ltr"}
                >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.length > 0 ? (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full px-4 py-2.5 text-sm flex items-center justify-between gap-3
                                        transition-colors duration-150 cursor-pointer
                                        ${value === option.value 
                                            ? 'bg-main/10 text-main font-medium' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className={`truncate flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                        {option.label}
                                    </span>
                                    {value === option.value && (
                                        <Check 
                                            size={16} 
                                            className="flex-shrink-0 text-main" 
                                        />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                {isRTL ? "لا توجد خيارات" : "No options"}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f9fafb;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>
        </div>
    );
};

export default CustomSelect;