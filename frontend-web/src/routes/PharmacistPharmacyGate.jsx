import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import Loading from "../components/common/Loading";
import PharmacyRequiredCard from "../components/pharmacie/PharmacyRequiredCard";
import { pharmacistLinks } from "./dashboardLinks";
import { getMyPharmacyStatus } from "../services/pharmacyService";

function PharmacistPharmacyGate({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasPharmacy, setHasPharmacy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        const status = await getMyPharmacyStatus();

        if (!isMounted) {
          return;
        }

        setHasPharmacy(Boolean(status?.has_pharmacy));
        setMessage(status?.message || "");

        if (status?.has_pharmacy === false) {
          navigate("/pharmacien/pharmacie", { replace: true });
        }
      } catch {
        if (isMounted) {
          setHasPharmacy(false);
          setMessage("Impossible de verifier la pharmacie associee a ce compte.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout title="Verification pharmacie" links={pharmacistLinks}>
        <Loading label="Verification de votre pharmacie..." />
      </DashboardLayout>
    );
  }

  if (!hasPharmacy) {
    return (
      <DashboardLayout title="Creation pharmacie requise" links={pharmacistLinks}>
        <PharmacyRequiredCard message={message || undefined} />
      </DashboardLayout>
    );
  }

  return children;
}

export default PharmacistPharmacyGate;
