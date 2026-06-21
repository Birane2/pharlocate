import { useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { adminLinks } from "../routes/dashboardLinks";

function AdminLayout({
  title = "Administration",
  subtitle,
  children,
  showDateFilter = false,
  selectedDate = "",
  startDate = "",
  endDate = "",
  onDateChange,
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
        <Header
          title={title}
          subtitle={subtitle}
          showDateFilter={showDateFilter}
          selectedDate={selectedDate}
          startDate={startDate}
          endDate={endDate}
          onDateChange={onDateChange}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onTodayClick={onTodayClick}
          onAllDataClick={onAllDataClick}
          onResetClick={onResetClick}
          actionLoading={actionLoading}
          notificationsPath="/admin/notifications"
        />

        <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-6">
          {children}
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
