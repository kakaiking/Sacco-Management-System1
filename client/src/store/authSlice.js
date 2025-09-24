import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for checking authentication
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return { username: '', id: 0, status: false };
      }

      const response = await axios.get('http://localhost:3001/auth/auth', {
        headers: {
          accessToken: token,
        },
      });

      if (response.data.error) {
        localStorage.removeItem('accessToken');
        return { username: '', id: 0, status: false };
      }

      return {
        username: response.data.username,
        id: response.data.id,
        status: true,
      };
    } catch (error) {
      // Only clear token if it's actually invalid (401/403), not network errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('accessToken');
        return { username: '', id: 0, status: false };
      }
      
      // For network errors, reject with the error
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3001/auth/login', {
        username,
        password,
      });

      if (response.data.error) {
        return rejectWithValue(response.data.error);
      }

      // Store token in localStorage
      localStorage.setItem('accessToken', response.data.token);

      return {
        username: response.data.username,
        id: response.data.id,
        status: true,
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.error || 'Login failed. Please try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    username: '',
    id: 0,
    status: false,
    isLoading: true,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('accessToken');
      state.username = '';
      state.id = 0;
      state.status = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check auth cases
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.username = action.payload.username;
        state.id = action.payload.id;
        state.status = action.payload.status;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.username = '';
        state.id = 0;
        state.status = false;
        state.error = action.payload;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.username = action.payload.username;
        state.id = action.payload.id;
        state.status = action.payload.status;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.username = '';
        state.id = 0;
        state.status = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
