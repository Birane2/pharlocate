import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pharmaBg">
        <p className="text-pharmaBlue font-semibold">Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#E2E8F2] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#1C2B4A]">
            Accès refusé
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#6B7A99]">
            Vous êtes connecté, mais votre rôle ne vous permet pas d’accéder à cette page.
          </p>
          <div className="mt-6 flex justify-center">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
