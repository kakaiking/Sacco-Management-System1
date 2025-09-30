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
        },
        currency_maintenance: {
          view: true,
          add: true,
          edit: true,
          delete: true,
          approve: true
        }
      },
      status: true
    };

    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInVzZXJJZCI6IlVTUi0zNTQ2Iiwicm9sZSI6IlN1cGVyIFVzZXIiLCJzYWNjb0lkIjoiU1lTVEVNIiwiYnJhbmNoSWQiOiJCUi0wMDEiLCJwZXJtaXNzaW9ucyI6eyJjdXJyZW5jeV9tYWludGVuYW5jZSI6eyJ2aWV3Ijp0cnVlLCJhZGQiOnRydWUsImVkaXQiOnRydWUsImRlbGV0ZSI6dHJ1ZSwiYXBwcm92ZSI6dHJ1ZX19LCJpYXQiOjE3NTkyMjQwMjUsImV4cCI6MTc1OTMxMDQyNX0.X3-PwQ36HsNdHOHhXeCsSvOl6L9psRFcVgWtC7gy0Eg";
    
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
    return localStorage.getItem('accessToken') === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInVzZXJJZCI6IlVTUi0zNTQ2Iiwicm9sZSI6IlN1cGVyIFVzZXIiLCJzYWNjb0lkIjoiU1lTVEVNIiwiYnJhbmNoSWQiOiJCUi0wMDEiLCJwZXJtaXNzaW9ucyI6eyJjdXJyZW5jeV9tYWludGVuYW5jZSI6eyJ2aWV3Ijp0cnVlLCJhZGQiOnRydWUsImVkaXQiOnRydWUsImRlbGV0ZSI6dHJ1ZSwiYXBwcm92ZSI6dHJ1ZX19LCJpYXQiOjE3NTkyMjQwMjUsImV4cCI6MTc1OTMxMDQyNX0.X3-PwQ36HsNdHOHhXeCsSvOl6L9psRFcVgWtC7gy0Eg';
  }
};

// Auto-set mock auth if not already authenticated
if (!localStorage.getItem('accessToken')) {
  console.log('Setting up mock authentication for testing...');
  mockAuth.setMockAuth();
}

