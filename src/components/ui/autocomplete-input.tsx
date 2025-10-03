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
    const prevValueRef = useRef<string>('');
    const wasDeletingRef = useRef<boolean>(false);

    useEffect(() => {
      if (!value || !value.trim()) {
        setSuggestion('');
        prevValueRef.current = value;
        return;
      }

      if (wasDeletingRef.current) {
        // Suppress ghost text immediately after a deletion until next non-delete input
        setSuggestion('');
        wasDeletingRef.current = false;
        prevValueRef.current = value;
        return;
      }

      const lower = value.toLowerCase();
      const match = suggestions.find(s => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower);
      setSuggestion(match || '');
      prevValueRef.current = value;
    }, [value, suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (suggestion && (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'Enter')) {
        e.preventDefault();
        onChange(suggestion);
        onSelect?.(suggestion);
        setSuggestion('');
      }
    };

    const acceptSuggestion = () => {
      if (suggestion) {
        onChange(suggestion);
        onSelect?.(suggestion);
        setSuggestion('');
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      const prev = prevValueRef.current || '';
      const isDeleting = next.length < prev.length;
      if (isDeleting) {
        // Clear ghost immediately and mark deletion so effect suppresses next render
        setSuggestion('');
        wasDeletingRef.current = true;
      } else {
        wasDeletingRef.current = false;
      }
      prevValueRef.current = next;
      onChange(next);
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
                onClick={acceptSuggestion}
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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={() => { if (suggestion) acceptSuggestion(); }}
            onTouchEnd={() => { if (suggestion) acceptSuggestion(); }}
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
