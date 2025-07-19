import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { syncWidgetData } from '@/utils/widgetSync';


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
    <div className="flex flex-col h-full max-w-[440px] mx-auto w-full">
      <div className="px-5 py-4">
        <h3 className="text-2xl font-bold mb-1">Coloring time</h3>
        <p className="text-muted-foreground">Choose your flava.</p>
      </div>

      {/* Color Grid */}
      <div className="grow px-5">
        <div className="grid grid-cols-10 gap-0 w-full aspect-[2/1.2] mb-6">
          {Array.from({ length: 100 }).map((_, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const hue = (col * 36) % 360; // 360/10 colors = 36° per column
            const lightness = 100 - (row * 100) / 9; // 10 rows of decreasing lightness
            const color = `hsl(${hue} 100% ${lightness}%)`; 
            
            return (
              <button
                key={i}
                onClick={() => handleColorSelect(color)}
                className="w-full h-full transition-transform hover:scale-110 hover:z-10"
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="p-5">
        <button
          onClick={() => handleColorSelect(selectedColor)}
          className="w-full bg-[#09121F] text-white py-3 px-4 rounded-lg font-bold text-[15px] hover:bg-[#1a1a1a] transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};