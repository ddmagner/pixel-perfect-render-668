import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { syncWidgetData } from '@/utils/widgetSync';

const colorOptions = [
  '#09121F', // Default dark
  '#1E40AF', // Blue
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#059669', // Green
  '#D97706', // Orange
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#4338CA', // Indigo
  '#65A30D', // Lime
];

export const ColorCustomization: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [selectedColor, setSelectedColor] = useState(settings.accentColor);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    updateSettings({
      accentColor: color,
    });
    
    // Update CSS custom properties for immediate visual feedback
    document.documentElement.style.setProperty('--accent-color', color);
    
    // Sync widget data for iOS widget
    syncWidgetData({ accentColor: color });
  };

  return (
    <div className="px-5 py-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-[#09121F] text-[18px] font-bold mb-3">Choose Accent Color</h3>
          <p className="text-[#BFBFBF] text-sm mb-4">
            Select a color to customize the app's appearance
          </p>
        </div>

        {/* Color Preview */}
        <div className="p-6 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: selectedColor }}
            />
            <div>
              <p className="text-[#09121F] font-bold">Preview</p>
              <p className="text-[#BFBFBF] text-sm">{selectedColor}</p>
            </div>
          </div>
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-5 gap-4">
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`w-12 h-12 rounded-full border-4 transition-all ${
                selectedColor === color
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        {/* Custom Color Input */}
        <div>
          <label className="block text-[#09121F] text-[15px] font-bold mb-2">
            Custom Color (Hex)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => {
                if (e.target.value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                  setSelectedColor(e.target.value);
                }
              }}
              onBlur={() => {
                if (selectedColor.match(/^#[0-9A-Fa-f]{6}$/)) {
                  handleColorSelect(selectedColor);
                }
              }}
              placeholder="#000000"
              className="flex-1 p-3 border border-gray-300 rounded-lg text-[#09121F] placeholder:text-[#BFBFBF]"
            />
            <div
              className="w-12 h-12 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => handleColorSelect('#09121F')}
          className="w-full bg-gray-100 text-[#09121F] py-3 px-4 rounded-lg font-bold text-[15px] hover:bg-gray-200 transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};