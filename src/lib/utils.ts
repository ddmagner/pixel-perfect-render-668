import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

export function formatHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    // Whole hours - no decimal
    return hours.toString();
  } else if (hours % 1 === 0.5) {
    // Half hours - remove leading 0
    return hours < 1 ? ".5" : hours.toString().replace(".50", ".5");
  } else {
    // Other decimals - keep as is but remove trailing zeros
    return hours.toFixed(2).replace(/\.?0+$/, '');
  }
}