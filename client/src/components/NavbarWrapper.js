import React from 'react';
import { useSidebar } from '../helpers/SidebarContext';

const NavbarWrapper = ({ children }) => {
  const { isOpen } = useSidebar();
  
  return (
    <div className={`navbar ${isOpen ? 'sidebar-open' : ''}`}>
      {children}
    </div>
  );
};

export default NavbarWrapper;
