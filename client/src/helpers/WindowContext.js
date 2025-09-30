import React, { createContext, useContext, useState, useCallback } from 'react';

const WindowContext = createContext();

export const useWindow = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindow must be used within a WindowProvider');
  }
  return context;
};

export const WindowProvider = ({ children }) => {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [nextWindowId, setNextWindowId] = useState(1);

  // Open a new window
  const openWindow = useCallback((windowConfig) => {
    const windowId = `window_${nextWindowId}`;
    const newWindow = {
      id: windowId,
      title: windowConfig.title,
      component: windowConfig.component,
      props: windowConfig.props || {},
      isMinimized: true, // Start minimized in tabs
      isMaximized: false,
      zIndex: 1000 + windows.length,
      createdAt: new Date(),
      ...windowConfig
    };

    setWindows(prev => {
      // First, minimize any currently open (non-minimized) windows
      const updatedWindows = prev.map(w => 
        !w.isMinimized ? { ...w, isMinimized: true } : w
      );
      
      // Then add the new window (minimized)
      return [...updatedWindows, newWindow];
    });
    
    // Don't set as active since it starts minimized
    setActiveWindowId(null);
    setNextWindowId(prev => prev + 1);
    
    return windowId;
  }, [windows.length, nextWindowId]);

  // Close a window
  const closeWindow = useCallback((windowId) => {
    setWindows(prev => {
      const newWindows = prev.filter(w => w.id !== windowId);
      // If we're closing the active window, set a new active window
      if (activeWindowId === windowId && newWindows.length > 0) {
        const lastWindow = newWindows[newWindows.length - 1];
        setActiveWindowId(lastWindow.id);
      } else if (newWindows.length === 0) {
        setActiveWindowId(null);
      }
      return newWindows;
    });
  }, [activeWindowId]);

  // Minimize a window
  const minimizeWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
    
    // If we're minimizing the active window, set a new active window
    if (activeWindowId === windowId) {
      const remainingWindows = windows.filter(w => w.id !== windowId);
      if (remainingWindows.length > 0) {
        const lastWindow = remainingWindows[remainingWindows.length - 1];
        setActiveWindowId(lastWindow.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [activeWindowId, windows]);

  // Restore a minimized window
  const restoreWindow = useCallback((windowId) => {
    setWindows(prev => {
      // First, minimize any currently open (non-minimized) windows
      const updatedWindows = prev.map(w => 
        !w.isMinimized ? { ...w, isMinimized: true } : w
      );
      
      // Then restore the selected window
      return updatedWindows.map(w => 
        w.id === windowId ? { ...w, isMinimized: false, zIndex: Math.max(...updatedWindows.map(w => w.zIndex)) + 1 } : w
      );
    });
    setActiveWindowId(windowId);
  }, []);

  // Bring window to front
  const bringToFront = useCallback((windowId) => {
    setWindows(prev => {
      // First, minimize any currently open (non-minimized) windows
      const updatedWindows = prev.map(w => 
        !w.isMinimized ? { ...w, isMinimized: true } : w
      );
      
      // Then bring the selected window to front
      return updatedWindows.map(w => 
        w.id === windowId ? { ...w, isMinimized: false, zIndex: Math.max(...updatedWindows.map(w => w.zIndex)) + 1 } : w
      );
    });
    setActiveWindowId(windowId);
  }, []);

  // Get active window
  const getActiveWindow = useCallback(() => {
    return windows.find(w => w.id === activeWindowId && !w.isMinimized);
  }, [windows, activeWindowId]);

  // Get minimized windows
  const getMinimizedWindows = useCallback(() => {
    return windows.filter(w => w.isMinimized);
  }, [windows]);

  // Check if a window is open
  const isWindowOpen = useCallback((windowType) => {
    return windows.some(w => w.type === windowType && !w.isMinimized);
  }, [windows]);

  // Get window by type
  const getWindowByType = useCallback((windowType) => {
    return windows.find(w => w.type === windowType);
  }, [windows]);

  const value = {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    bringToFront,
    getActiveWindow,
    getMinimizedWindows,
    isWindowOpen,
    getWindowByType
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};
