import React from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { useViewMode } from '../../../contexts/ViewModeContext';

const ViewSwitcher: React.FC = () => {
  const { activeDevice, setActiveDevice, viewportWidth, setViewportWidth } = useViewMode();

  const btnActive = 'bg-zinc-700 text-white';
  const btnInactive = 'text-zinc-400 hover:bg-zinc-800';

  return (
    <div className="flex items-center space-x-2 p-2 bg-zinc-900 rounded-lg">
      <button
        onClick={() => { setActiveDevice('desktop'); setViewportWidth('100%'); }}
        className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'desktop' ? btnActive : btnInactive}`}
        title="Desktop (100%)"
      >
        <Monitor size={16} />
      </button>
      <button
        onClick={() => { setActiveDevice('tablet'); /* viewport set by context effect */ }}
        className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'tablet' ? btnActive : btnInactive}`}
        title="Tablet (768px)"
      >
        <Tablet size={16} />
      </button>
      <button
        onClick={() => { setActiveDevice('mobile'); /* viewport set by context effect */ }}
        className={`p-2 rounded-lg transition-all duration-200 ${activeDevice === 'mobile' ? btnActive : btnInactive}`}
        title="Mobile (375px)"
      >
        <Smartphone size={16} />
      </button>
    </div>
  );
};

export default ViewSwitcher;
