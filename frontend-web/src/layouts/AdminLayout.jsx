import { useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/layout/Sidebar";
import { adminLinks } from "../routes/dashboardLinks";

function AdminLayout({
  title = "Administration",
  subtitle,
  children,
  showDateFilter = false,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  onTodayClick,
  onAllDataClick,
  onResetClick,
  actionLoading = false,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-pharmaText">
      <Sidebar
        links={adminLinks}
        title="Administration"
        showLogout={false}
        showUserFooter
        width="admin"
        collapsible
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main
        className={`min-h-screen pb-20 transition-all duration-300 lg:pb-0 ${
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[230px]"
        }`}
      >
        <AdminHeader
          title={title}
          subtitle={subtitle}
          showDateFilter={showDateFilter}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onTodayClick={onTodayClick}
          onAllDataClick={onAllDataClick}
          onResetClick={onResetClick}
          actionLoading={actionLoading}
          notificationsPath="/admin/notifications"
          onMenuClick={() => setSidebarCollapsed((c) => !c)}
        />

        <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-6">
          {children}
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
