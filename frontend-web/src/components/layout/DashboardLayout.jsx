import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import PharmacienLayout from "../../layouts/PharmacienLayout";

function DashboardLayout({ title, links, children }) {
  const isPharmacienLayout = links.some((link) =>
    link.path?.startsWith("/pharmacien/")
  );

  if (isPharmacienLayout) {
    return <PharmacienLayout title={title}>{children}</PharmacienLayout>;
  }

  return (
    <div className="min-h-screen bg-pharmaBg text-pharmaText">
      <div className="flex">
        <Sidebar links={links} />

        <main className="min-h-screen flex-1 pb-20 lg:ml-64 lg:pb-0">
          <Topbar title={title} />

          <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </section>
        </main>
      </div>

      <MobileNav links={links} />
    </div>
  );
}

export default DashboardLayout;
