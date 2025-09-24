import { createContext } from "react";

export const AuthContext = createContext({
  authState: {
    username: "",
    id: 0,
    userId: "",
    role: "",
    permissions: {},
    status: false,
  },
  setAuthState: () => {},
  logout: () => {},
  isLoading: true,
});
