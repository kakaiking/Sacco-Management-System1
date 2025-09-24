import React from 'react';
import { useSidebar } from '../helpers/SidebarContext';

const DashboardWrapper = ({ children }) => {
  const { isOpen } = useSidebar();
  
  return (
    <div className={`dashboard ${isOpen ? 'sidebar-open' : ''}`}>
      {children}
    </div>
  );
};

export default DashboardWrapper;
