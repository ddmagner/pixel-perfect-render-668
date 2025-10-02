import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ suggestions, value, onChange, onSelect, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value.trim()) {
        const filtered = suggestions.filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setIsOpen(filtered.length > 0);
      } else {
        setFilteredSuggestions([]);
        setIsOpen(false);
      }
      setSelectedIndex(-1);
    }, [value, suggestions]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || filteredSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleSelectSuggestion(filteredSuggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    const handleSelectSuggestion = (suggestion: string) => {
      onChange(suggestion);
      onSelect?.(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
    };

    return (
      <div ref={containerRef} className="relative flex-1">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          className={cn(
            "flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF] w-full",
            className
          )}
          {...props}
        />
        
        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={cn(
                  "px-3 py-2 cursor-pointer text-[15px] leading-5 tracking-[0.1px]",
                  index === selectedIndex 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

AutocompleteInput.displayName = 'AutocompleteInput';
