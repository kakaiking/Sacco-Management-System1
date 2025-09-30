import React from 'react';
import { FiX, FiMinus } from 'react-icons/fi';
import { useWindow } from '../helpers/WindowContext';
import { useSidebar } from '../helpers/SidebarContext';

const WindowWrapper = ({ window }) => {
  const { bringToFront, minimizeWindow, closeWindow } = useWindow();
  const { isOpen: isSidebarOpen } = useSidebar();
  
  const handleHeaderClick = () => {
    bringToFront(window.id);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    minimizeWindow(window.id);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    closeWindow(window.id);
  };

  const Component = window.component;

  return (
    <div 
      className={`window-wrapper ${isSidebarOpen ? 'sidebar-open' : ''} ${window.isMinimized ? 'minimized' : ''}`}
      style={{
        zIndex: window.isMinimized ? 1 : window.zIndex,
        position: 'fixed',
        top: '120px', // Always positioned below tabs area (60px navbar + 60px tabs)
        left: isSidebarOpen ? '320px' : '60px', // Add 60px margin on left when closed (25px handle + 35px spacing), 40px more when sidebar open (280px sidebar + 40px spacing)
        right: '20px', // Add 20px margin on right
        bottom: '20px', // Add 20px margin on bottom
        backgroundColor: 'white',
        borderRadius: '8px', // Add border radius for better visual separation
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', // Add shadow for depth
        display: window.isMinimized ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      onClick={handleHeaderClick}
    >
      {/* Window Header */}
      <div className="window-header">
        <div className="window-title">
          <span className="window-icon">
            {window.icon || '📄'}
          </span>
          <span className="window-title-text">
            {window.title}
          </span>
        </div>
        <div className="window-controls">
          <button
            className="window-control-button minimize"
            onClick={handleMinimize}
            title="Minimize"
          >
            <FiMinus size={12} />
          </button>
          <button
            className="window-control-button close"
            onClick={handleClose}
            title="Close"
          >
            <FiX size={12} />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="window-content">
        <Component {...window.props} />
      </div>
    </div>
  );
};

export default WindowWrapper;
