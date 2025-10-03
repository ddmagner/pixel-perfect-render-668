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
    const [suggestion, setSuggestion] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value.trim()) {
        // Find first matching suggestion that starts with the input value
        const match = suggestions.find(s =>
          s.toLowerCase().startsWith(value.toLowerCase()) && 
          s.toLowerCase() !== value.toLowerCase()
        );
        setSuggestion(match || '');
      } else {
        setSuggestion('');
      }
    }, [value, suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestion && (e.key === 'Tab' || e.key === 'ArrowRight')) {
        e.preventDefault();
        onChange(suggestion);
        onSelect?.(suggestion);
        setSuggestion('');
      }
    };

    const handleSuggestionClick = () => {
      if (suggestion) {
        onChange(suggestion);
        onSelect?.(suggestion);
        setSuggestion('');
      }
    };

    return (
      <div className="relative flex-1">
        <div className="relative flex items-center">
          {/* Ghost text for autocomplete preview */}
          {suggestion && (
            <div 
              className="absolute inset-0 pointer-events-none flex items-center text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] pl-[1px]"
              aria-hidden="true"
            >
              <span className="invisible">{value}</span>
              <span 
                className="text-[#BFBFBF] cursor-pointer hover:text-[#999999] transition-colors pointer-events-auto"
                onClick={handleSuggestionClick}
              >
                {suggestion.slice(value.length)}
              </span>
            </div>
          )}
          
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-[1_0_0] text-[#09121F] text-[15px] font-normal leading-5 tracking-[0.1px] bg-transparent border-none outline-none placeholder:text-[#BFBFBF] w-full relative",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

AutocompleteInput.displayName = 'AutocompleteInput';
