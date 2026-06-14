/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("access_token"))
  );

  const getProfile = async () => {
    try {
      const res = await API.get("/api/auth/profile/");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      return res.data;
    } catch {
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    const run = async () => {
      await getProfile();
    };

    run();
  }, []);

  const login = async (phoneNumber, password) => {
    const res = await API.post("/api/auth/login/", {
      phone_number: phoneNumber,
      password,
    });

    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);

    const profile = await getProfile();

    if (!profile) {
      throw new Error(
        "Connexion reussie, mais impossible de recuperer le profil utilisateur."
      );
    }

    return profile;
  };

  const persistAuthPayload = (data) => {
    if (data?.access) {
      localStorage.setItem("access_token", data.access);
    }

    if (data?.refresh) {
      localStorage.setItem("refresh_token", data.refresh);
    }

    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const verifyEmailOtp = async (email, otp) => {
    const res = await API.post("/api/auth/verify-otp/", {
      email,
      otp,
    });
    persistAuthPayload(res.data);
    return res.data;
  };

  const resendEmailOtp = async (email) => {
    const res = await API.post("/api/auth/resend-otp/", {
      email,
    });
    return res.data;
  };

  const verifyRegisterOtp = verifyEmailOtp;
  const resendRegisterOtp = resendEmailOtp;

  const register = async (formData) => {
    const res = await API.post("/api/auth/register/", formData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyEmailOtp,
        resendEmailOtp,
        verifyRegisterOtp,
        resendRegisterOtp,
        register,
        logout,
        isAuthenticated: !!user,
        role: user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
