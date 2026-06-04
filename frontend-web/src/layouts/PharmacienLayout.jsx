import Header from "../components/layout/Header";
import PharmacienSidebar from "../components/layout/PharmacienSidebar";

function PharmacienLayout({
  title = "Espace pharmacien",
  pharmacy,
  pharmacyHeader = false,
  headerSubtitle = "Vue rapide de votre pharmacie",
  showHeaderSubtitle = true,
  children,
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_46%,#F0FAFA_100%)] text-pharmaText">
      <PharmacienSidebar />

      <main className="min-h-screen pb-24 lg:ml-52 lg:pb-0">
        <Header
          title={title}
          subtitle={headerSubtitle}
          pharmacy={pharmacy}
          pharmacyHeader={pharmacyHeader}
          showSubtitle={showHeaderSubtitle}
        />

        <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-7">
          {children}
        </section>
      </main>
    </div>
  );
}

export default PharmacienLayout;
