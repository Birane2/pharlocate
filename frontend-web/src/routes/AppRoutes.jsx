import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route
          path="/admin/dashboard"
          element={<div className="p-6">Dashboard Admin</div>}
        />

        <Route
          path="/pharmacien/dashboard"
          element={<div className="p-6">Dashboard Pharmacien</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
