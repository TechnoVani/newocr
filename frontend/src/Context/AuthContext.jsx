import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const isUnauthorized = (error) => Number(error?.response?.status) === 401;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [user, setUser] = useState(readStoredUser);
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem("authToken"));
  const authRequestIdRef = useRef(0);
  const tokenRef = useRef(token);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
  }, []);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    const requestId = ++authRequestIdRef.current;
    axiosInstance.get("/auth/me")
      .then((response) => {
        if (
          active &&
          requestId === authRequestIdRef.current &&
          tokenRef.current === token &&
          localStorage.getItem("authToken") === token &&
          response.data?.data?.user
        ) {
          updateUser(response.data.data.user);
        }
      })
      .catch((error) => {
        if (!active || requestId !== authRequestIdRef.current || tokenRef.current !== token) return;
        if (!isUnauthorized(error)) return;
        setAuthToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setToken(null);
        updateUser(null);
      })
      .finally(() => {
        if (active && requestId === authRequestIdRef.current) setAuthReady(true);
      });
    return () => { active = false; };
  }, [token, updateUser]);

  const login = useCallback(async (credentials, rememberMe) => {
    authRequestIdRef.current += 1;
    setAuthReady(false);
    setAuthToken(null);
    tokenRef.current = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    updateUser(null);

    const response = await axiosInstance.post("/auth/login", credentials);
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Authentication failed");
    }

    const auth = response.data.data;
    authRequestIdRef.current += 1;
    localStorage.setItem("authToken", auth.token);
    setAuthToken(auth.token);
    tokenRef.current = auth.token;
    updateUser(auth.user);
    setAuthReady(true);
    setToken(auth.token);

    if (rememberMe) {
      localStorage.setItem("rememberedIdentifier", credentials.personal_email || credentials.mobile);
    } else {
      localStorage.removeItem("rememberedIdentifier");
    }
    return auth;
  }, [updateUser]);

  const logout = useCallback(() => {
    setAuthToken(null);
    tokenRef.current = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberedIdentifier");
    setToken(null);
    setUser(null);
    setAuthReady(true);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    authReady,
    isAuthenticated: Boolean(token) && Boolean(user),
    login,
    logout,
    updateUser,
  }), [token, user, authReady, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
