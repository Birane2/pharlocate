import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PasswordChangeForm from "../../components/profile/PasswordChangeForm";
import ProfileEditForm from "../../components/profile/ProfileEditForm";
import ProfileInfoCard from "../../components/profile/ProfileInfoCard";
import {
  changeAdminPassword,
  getAdminProfile,
  updateAdminProfile,
} from "../../services/adminProfileService";

function getErrorMessage(error, fallback) {
  const data = error.response?.data;

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey];

    if (Array.isArray(firstValue)) {
      return firstValue[0];
    }

    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return fallback;
}

function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getAdminProfile()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Impossible de charger le profil administrateur."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleProfileSubmit = async (payload) => {
    setSavingProfile(true);
    setError("");
    setSuccess("");

    try {
      const data = await updateAdminProfile(payload);
      setProfile(data);
      setSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de modifier le profil."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (payload, resetForm) => {
    setChangingPassword(true);
    setError("");
    setSuccess("");

    try {
      await changeAdminPassword(payload);
      resetForm?.();
      setSuccess("Mot de passe modifié avec succès.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de modifier le mot de passe."));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AdminLayout
      title="Profil administrateur"
      subtitle="Gérez vos informations personnelles en toute sécurité."
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-[#2FA6A3]/20 bg-[#2FA6A3]/10 px-4 py-3 text-sm font-bold text-[#167769]">
            {success}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <ProfileInfoCard profile={profile} />
            <div className="grid gap-4">
              <ProfileEditForm
                key={`${profile?.id || "admin"}-${profile?.email || ""}-${profile?.phone_number || ""}`}
                profile={profile}
                loading={savingProfile}
                onSubmit={handleProfileSubmit}
              />
              <PasswordChangeForm
                loading={changingPassword}
                onSubmit={handlePasswordSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProfile;
