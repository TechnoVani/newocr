import { useCallback, useMemo, useState } from "react";
import axiosInstance, { setAuthToken } from "../config/axios";
import AuthContext from "./auth-context";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(readStoredUser);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
  }, []);

  const login = useCallback(async (credentials, rememberMe) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Authentication failed");
    }

    const auth = response.data.data;
    localStorage.setItem("authToken", auth.token);
    setAuthToken(auth.token);
    setToken(auth.token);
    updateUser(auth.user);

    if (rememberMe) {
      localStorage.setItem("rememberedIdentifier", credentials.personal_email || credentials.mobile);
    } else {
      localStorage.removeItem("rememberedIdentifier");
    }
    return auth;
  }, [updateUser]);

  const logout = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberedIdentifier");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
    updateUser,
  }), [token, user, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
