/**
 * Sanitizes color values to prevent XSS attacks via dangerouslySetInnerHTML.
 * Allows valid hex colors (#RRGGBB) and HSL colors (hsl(...) or raw HSL values).
 */

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
// Matches hsl(h, s%, l%) or hsl(h s% l%) formats
const HSL_FUNCTION_REGEX = /^hsl\(\s*\d{1,3}(?:\.\d+)?(?:deg)?\s*[,\s]\s*\d{1,3}(?:\.\d+)?%\s*[,\s]\s*\d{1,3}(?:\.\d+)?%\s*\)$/i;
// Matches raw HSL values like "210 100% 50%" or "210, 100%, 50%"
const HSL_RAW_REGEX = /^\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%$/;

const DEFAULT_COLOR = '#09121F';

/**
 * Validates and sanitizes a color value.
 * Returns the color if valid, otherwise returns the default color.
 */
export const sanitizeColor = (color: string | undefined | null): string => {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COLOR;
  }
  
  const trimmedColor = color.trim();
  
  // Check hex format
  if (HEX_COLOR_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }
  
  // Check HSL function format
  if (HSL_FUNCTION_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }
  
  // Check raw HSL values (for CSS var format) and wrap in hsl()
  if (HSL_RAW_REGEX.test(trimmedColor)) {
    return `hsl(${trimmedColor})`;
  }
  
  return DEFAULT_COLOR;
};

/**
 * Checks if a color value is a valid hex color.
 */
export const isValidHexColor = (color: string): boolean => {
  return HEX_COLOR_REGEX.test(color);
};

/**
 * Checks if a color value is a valid HSL color.
 */
export const isValidHslColor = (color: string): boolean => {
  return HSL_FUNCTION_REGEX.test(color) || HSL_RAW_REGEX.test(color);
};

/**
 * Checks if a color value is valid (hex or HSL).
 */
export const isValidColor = (color: string): boolean => {
  return isValidHexColor(color) || isValidHslColor(color);
};
