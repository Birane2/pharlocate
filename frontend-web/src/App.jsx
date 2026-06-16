import { Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyResetOtp from "./pages/auth/VerifyResetOtp";
import ResetPassword from "./pages/auth/ResetPassword";
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
import PharmacienAvis from "./pages/pharmacien/PharmacienAvis";
import Home from "./pages/public/Home";
import PharmacyList from "./pages/public/PharmacyList";
import PharmacyDetail from "./pages/public/PharmacyDetail";
import MapPage from "./pages/public/MapPage";
import NewReservation from "./pages/user/NewReservation";
import UserReservations from "./pages/user/UserReservations";
import Notifications from "./pages/user/Notifications";
import Payments from "./pages/user/Payments";
import PaymentDetail from "./pages/user/PaymentDetail";
import Invoices from "./pages/user/Invoices";
import InvoiceDetail from "./pages/user/InvoiceDetail";
import UserDashboard from "./pages/user/UserDashboard";
import FinanceDashboard from "./pages/pharmacien/FinanceDashboard";
import FinanceTransactions from "./pages/pharmacien/FinanceTransactions";
import PharmacienPayments from "./pages/pharmacien/PharmacienPayments";
import PaymentMethodsConfig from "./pages/pharmacien/PaymentMethodsConfig";
import Subscription from "./pages/pharmacien/Subscription";
import SubscriptionPayment from "./pages/pharmacien/SubscriptionPayment";
import Deliveries from "./pages/pharmacien/Deliveries";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminFinanceList from "./pages/admin/AdminFinanceList";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPlatformPaymentMethods from "./pages/admin/AdminPlatformPaymentMethods";
import AdminSubscriptionPayments from "./pages/admin/AdminSubscriptionPayments";
import AdminSubscriptionRefunds from "./pages/admin/AdminSubscriptionRefunds";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminCommissionInvoices from "./pages/admin/AdminCommissionInvoices";
import AdminCommissionInvoiceDetail from "./pages/admin/AdminCommissionInvoiceDetail";
import CommissionInvoices from "./pages/pharmacien/CommissionInvoices";
import CommissionInvoiceDetail from "./pages/pharmacien/CommissionInvoiceDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pharmacies" element={<PharmacyList />} />
      <Route path="/pharmacies/:id" element={<PharmacyDetail />} />
      <Route path="/map" element={<MapPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/verify" element={<VerifyResetOtp />} />
      <Route path="/reset-password/new" element={<ResetPassword />} />

      <Route
        path="/reservations/new/:pharmacyId"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <NewReservation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/reservations"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <UserReservations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <Payments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments/:id"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <PaymentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <Invoices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute allowedRoles={["utilisateur"]}>
            <InvoiceDetail />
          </ProtectedRoute>
        }
      />

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

      <Route
        path="/pharmacien/avis"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PharmacienAvis />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/finance"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <FinanceDashboard />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/transactions"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <FinanceTransactions />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/orders"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PharmacienPayments />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/payments"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PharmacienPayments />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/payment-methods"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <PaymentMethodsConfig />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/deliveries"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <Deliveries />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/subscription"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <Subscription />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pharmacien/subscription/payment"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <SubscriptionPayment />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/finance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFinance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminTransactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payment-methods"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPlatformPaymentMethods />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/subscription-payments"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSubscriptionPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/subscription-refunds"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminSubscriptionRefunds />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFinanceList type="invoices" title="Gestion factures" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/refunds"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFinanceList type="refunds" title="Gestion remboursements" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminFinanceList type="subscriptions" title="Gestion abonnements" />
          </ProtectedRoute>
        }
      />

      {/* Commission invoices — admin */}
      <Route
        path="/admin/finance/commission-invoices"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCommissionInvoices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finance/commission-invoices/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCommissionInvoiceDetail />
          </ProtectedRoute>
        }
      />
      {/* alias for old path */}
      <Route
        path="/admin/commission-invoices"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCommissionInvoices />
          </ProtectedRoute>
        }
      />

      {/* Commission invoices — pharmacien */}
      <Route
        path="/pharmacien/finance/invoices"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <CommissionInvoices />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacien/finance/invoices/:id"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <CommissionInvoiceDetail />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />
      {/* alias for old path */}
      <Route
        path="/pharmacien/commission-invoices"
        element={
          <ProtectedRoute allowedRoles={["pharmacien"]}>
            <PharmacistPharmacyGate>
              <CommissionInvoices />
            </PharmacistPharmacyGate>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
