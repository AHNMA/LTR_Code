import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type DeviceMode = 'mobile' | 'tablet' | 'desktop' | 'custom';

interface ViewModeContextType {
  activeDevice: DeviceMode;
  setActiveDevice: (d: DeviceMode) => void;
  viewportWidth: number | '100%';
  setViewportWidth: (w: number | '100%') => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeDevice, setActiveDevice] = useState<DeviceMode>('desktop');
  const [viewportWidth, setViewportWidth] = useState<number | '100%'>('100%');

  useEffect(() => {
    // Keep viewportWidth in sync with the selected device unless custom
    if (activeDevice === 'mobile') setViewportWidth(375);
    else if (activeDevice === 'tablet') setViewportWidth(768);
    else if (activeDevice === 'desktop') setViewportWidth('100%');
    // custom mode will be controlled by setViewportWidth from UI
  }, [activeDevice]);

  useEffect(() => {
    // Adjust root font-size so Tailwind rem-based utilities scale with simulated viewport.
    // Mobile -> smaller base, Tablet -> medium, Desktop -> default.
    if (typeof window === 'undefined') return;
    const orig = document.documentElement.style.fontSize || '';
    let newSize = '';
    if (activeDevice === 'mobile') newSize = '14px';
    else if (activeDevice === 'tablet') newSize = '15px';
    else if (activeDevice === 'desktop') newSize = '16px';
    else if (activeDevice === 'custom') {
      // For custom widths, derive scale from viewportWidth if numeric
      if (typeof viewportWidth === 'number') {
        // base 1366 -> 16px; scale linearly but clamp
        const scale = Math.max(12, Math.min(20, Math.round((viewportWidth / 1366) * 16)));
        newSize = `${scale}px`;
      } else newSize = '16px';
    }
    if (newSize) document.documentElement.style.fontSize = newSize;
    return () => { document.documentElement.style.fontSize = orig; };
  }, [activeDevice, viewportWidth]);

  return (
    <ViewModeContext.Provider value={{ activeDevice, setActiveDevice, viewportWidth, setViewportWidth }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
};
