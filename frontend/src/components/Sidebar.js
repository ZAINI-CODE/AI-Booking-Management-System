import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, CalendarDays, Settings as SettingsIcon, DatabaseBackup, PlusCircle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/ai-booking", label: "AI Booking", icon: Sparkles, testId: "nav-ai-booking" },
  { to: "/bookings", label: "Bookings", icon: CalendarDays, testId: "nav-bookings" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "nav-settings" },
  { to: "/backup", label: "Backup", icon: DatabaseBackup, testId: "nav-backup" },
];

export default function Sidebar({ onNavigate }) {
  const { settings } = useSettings();

  return (
    <aside className="h-full flex flex-col">
      <div className="h-16 px-5 flex items-center border-b border-[#374151]">
        {settings.logoDataUrl ? (
          <img src={settings.logoDataUrl} alt="FUN FARMHOUSE" className="h-9 w-auto max-w-[180px] object-contain" data-testid="sidebar-logo" />
        ) : (
          <span className="font-heading font-bold tracking-tight text-lg text-white" data-testid="sidebar-brand">
            FUN FARMHOUSE
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map(({ to, label, icon: Icon, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            data-testid={testId}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-gray-300 hover:text-white hover:bg-[#1F2937] border border-transparent",
              ].join(" ")
            }
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#374151]">
        <NavLink
          to="/bookings/new"
          onClick={onNavigate}
          data-testid="sidebar-new-booking-btn"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Booking
        </NavLink>
        <p className="mt-3 text-[11px] text-gray-500 font-mono text-center tracking-tight">v1.0 · local-first</p>
      </div>
    </aside>
  );
}
