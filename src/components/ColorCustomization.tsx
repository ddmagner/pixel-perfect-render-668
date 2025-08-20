import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { syncWidgetData } from '@/utils/widgetSync';
export const ColorCustomization: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    settings,
    updateSettings
  } = useApp();
  const [selectedColor, setSelectedColor] = useState(settings.accentColor);
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    updateSettings({
      accentColor: color
    });

    // Update CSS custom properties for immediate visual feedback
    document.documentElement.style.setProperty('--accent-color', color);

    // Update all elements that currently use #FF4015
    const elementsToUpdate = document.querySelectorAll('[fill="#FF4015"], [style*="fill: #FF4015"]');
    elementsToUpdate.forEach((element) => {
      if (element instanceof SVGElement || element instanceof HTMLElement) {
        element.setAttribute('fill', color);
        if (element.style.fill) {
          element.style.fill = color;
        }
      }
    });

    // Update the main speech bubble background color
    const speechBubblePath = document.querySelector('path[fill="#FF4015"]');
    if (speechBubblePath) {
      speechBubblePath.setAttribute('fill', color);
    }

    // Sync widget data for iOS widget
    syncWidgetData({
      accentColor: color
    });
  };
  return <div className="flex flex-col h-full max-w-[440px] mx-auto w-full">
      <div className="px-5 py-4">
        
        <p className="text-muted-foreground">Choose your flava.</p>
      </div>

      {/* Color Grid */}
      <div className="grow px-5">
        <div className="grid grid-cols-10 gap-0 w-full aspect-square mb-2.5">
          {Array.from({
          length: 70
        }).map((_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10) + 1; // Start from row 1 instead of row 0
          const hue = col * 36 % 360; // 360/10 colors = 36° per column
          const lightness = 100 - row * 100 / 9; // Keep original 9-row lightness calculation
          const color = `hsl(${hue} 100% ${lightness}%)`;
          return <button key={i} onClick={() => handleColorSelect(color)} className="w-full h-full transition-transform hover:scale-110 hover:z-10" style={{
            backgroundColor: color
          }} aria-label={`Select color ${color}`} />;
        })}
        </div>
      </div>

      {/* Save Button */}
      <div className="p-5">
        <button onClick={() => { handleColorSelect(selectedColor); onClose?.(); }} className="w-full py-3 px-4 font-bold text-[15px] transition-colors text-white hover:opacity-90" style={{ backgroundColor: '#09121F' }}>
          Save
        </button>
      </div>
    </div>;
};