import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { adminLinks } from "../routes/dashboardLinks";

function AdminLayout({ title = "Administration", subtitle, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_52%,#F3FAFA_100%)] text-pharmaText">
      <Sidebar
        links={adminLinks}
        title="Administration"
        showLogout={false}
        showUserFooter
        width="wide"
      />

      <main className="min-h-screen pb-20 lg:ml-64 lg:pb-0">
        <Header title={title} subtitle={subtitle} />

        <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(47,166,163,0.08),transparent_28%),linear-gradient(135deg,#F8FBFD_0%,#FFFFFF_56%,#F3FAFA_100%)] p-3 sm:p-4 lg:p-5">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
