import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children, isAuthenticated = false }) => {
  // If not authenticated, sidebar should be closed and disabled
  // If authenticated, sidebar should be open by default
  const [isOpen, setIsOpen] = useState(isAuthenticated);

  // Update sidebar state when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsOpen(true); // Open sidebar when user logs in
    } else {
      setIsOpen(false); // Close sidebar when user logs out
    }
  }, [isAuthenticated]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isAuthenticated }}>
      {children}
    </SidebarContext.Provider>
  );
};
