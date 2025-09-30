import React from 'react';
import { useWindow } from '../helpers/WindowContext';
import WindowWrapper from './WindowWrapper';
import WindowTabs from './WindowTabs';

const WindowManager = () => {
  const { windows, getMinimizedWindows } = useWindow();
  
  const minimizedWindows = getMinimizedWindows();
  const visibleWindows = windows.filter(window => !window.isMinimized);

  return (
    <>
      {/* Window Tabs - always show when there are any windows */}
      {windows.length > 0 && <WindowTabs />}
      
      {/* Render all windows but only show non-minimized ones */}
      {windows.map((window) => (
        <WindowWrapper
          key={window.id}
          window={window}
        />
      ))}
    </>
  );
};

export default WindowManager;
