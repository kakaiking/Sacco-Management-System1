import React from 'react';
import { FiX, FiMinus } from 'react-icons/fi';
import { useWindow } from '../helpers/WindowContext';
import { useSidebar } from '../helpers/SidebarContext';

const WindowTabs = () => {
  const { windows, restoreWindow, closeWindow } = useWindow();
  const { isOpen: isSidebarOpen } = useSidebar();

  return (
    <div className={`window-tabs ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="window-tabs-container">
        {windows.map((window) => (
          <div
            key={window.id}
            className={`window-tab ${!window.isMinimized ? 'active' : ''}`}
            onClick={() => restoreWindow(window.id)}
            title={window.title}
          >
            <div className="window-tab-content">
              <span className="window-tab-title">
                {window.tabTitle || window.title}
              </span>
            </div>
            <div className="window-tab-actions">
              <button
                className="window-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(window.id);
                }}
                title="Close"
              >
                <FiX size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindowTabs;
