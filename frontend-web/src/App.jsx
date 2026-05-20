import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import PharmacistPharmacyGate from "./routes/PharmacistPharmacyGate";
import PharmacienDashboard from "./pages/pharmacien/PharmacienDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPharmacies from "./pages/admin/AdminPharmacies";
import AdminUsers from "./pages/admin/AdminUsers";
import PharmaciesValidation from "./pages/admin/PharmaciesValidation";
import PharmacieProfile from "./pages/pharmacien/PharmacieProfile";
import HorairesList from "./pages/pharmacien/HorairesList";
import PharmacienStocks from "./pages/pharmacien/PharmacienStocks";
import ReservationsList from "./pages/pharmacien/ReservationsList";
import StockCreate from "./pages/pharmacien/StockCreate";
import Home from "./pages/public/Home";
import PharmacyList from "./pages/public/PharmacyList";
import PharmacyDetail from "./pages/public/PharmacyDetail";
import ReservationCreatePlaceholder from "./pages/public/ReservationCreatePlaceholder";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pharmacies" element={<PharmacyList />} />
      <Route path="/pharmacies/:id" element={<PharmacyDetail />} />
      <Route path="/reservations/new" element={<ReservationCreatePlaceholder />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/pharmacien/dashboard"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PharmacienDashboard />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/pharmacies-validation"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PharmaciesValidation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/pharmacies"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPharmacies />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/profil"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacieProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/pharmacie"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacieProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/horaires"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <HorairesList />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/horaires/nouveau"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <HorairesList />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/horaires/:horaireId/modifier"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <HorairesList />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/stocks"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PharmacienStocks />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/stocks/ajouter"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <StockCreate />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/reservations"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <ReservationsList />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
