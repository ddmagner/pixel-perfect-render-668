/**
 * Sanitizes color values to prevent XSS attacks via dangerouslySetInnerHTML.
 * Only allows valid hex color formats.
 */

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
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
  
  if (HEX_COLOR_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }
  
  return DEFAULT_COLOR;
};

/**
 * Checks if a color value is a valid hex color.
 */
export const isValidHexColor = (color: string): boolean => {
  return HEX_COLOR_REGEX.test(color);
};
