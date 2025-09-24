// Mock authentication for testing purposes
export const mockAuth = {
  // Set mock authentication data
  setMockAuth: () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      role: "Admin",
      permissions: {
        account_types_maintenance: {
          view: true,
          add: true,
          edit: true,
          delete: true,
          approve: true
        }
      },
      status: true
    };

    const mockToken = "mock-jwt-token-12345";
    
    // Set in localStorage
    localStorage.setItem('accessToken', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    return { user: mockUser, token: mockToken };
  },

  // Clear mock authentication
  clearMockAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  // Check if mock auth is set
  isMockAuthSet: () => {
    return localStorage.getItem('accessToken') === 'mock-jwt-token-12345';
  }
};

// Auto-set mock auth if not already authenticated
if (!localStorage.getItem('accessToken')) {
  console.log('Setting up mock authentication for testing...');
  mockAuth.setMockAuth();
}

