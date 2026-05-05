import { createContext, useContext, useMemo, useState } from "react";
import { loginRequest } from "../services/api.js";
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser
} from "../utils/storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedUser = getStoredUser();
  const storedToken = storedUser?.role ? getStoredToken() : null;
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(storedUser?.role ? storedUser : null);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    const nextToken = data.token || data.jwt || data.accessToken;
    const nextUser = data.user || {
      email: credentials.email,
      role: credentials.role,
      student_id: data.student_id,
      name: data.name
    };

    if (!nextToken) throw new Error("Login response did not include a token.");

    setStoredToken(nextToken);
    setStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    clearStoredToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
