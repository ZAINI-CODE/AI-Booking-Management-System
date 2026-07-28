import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex bg-[#111827] text-[#F9FAFB] grain-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0 border-r border-[#374151] bg-[#0f172a]">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" data-testid="mobile-sidebar-overlay">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative w-64 bg-[#0f172a] border-r border-[#374151]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[#374151] bg-[#111827] sticky top-0 z-40">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md hover:bg-[#1F2937] transition-colors"
            aria-label="Open menu"
            data-testid="open-sidebar-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="logo" className="h-7 w-auto" />
            ) : (
              <span className="font-heading font-bold tracking-tight text-base">FUN FARMHOUSE</span>
            )}
          </div>
          <div className="w-8" />
        </div>

        <main key={location.pathname} className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
