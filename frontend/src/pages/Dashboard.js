import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, CalendarDays, Coins, Clock3, Wallet, Sparkles, DatabaseBackup, Upload, PlusCircle, Inbox } from "lucide-react";
import StatCard from "@/components/StatCard";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import { useBookings } from "@/context/BookingContext";
import { formatPKR } from "@/utils/currency";
import { todayISO, isUpcomingWithin } from "@/utils/dateHelpers";
import { useSettings } from "@/context/SettingsContext";

export default function Dashboard() {
  const { bookings, stats } = useBookings();
  const { settings } = useSettings();

  const today = todayISO();
  const todays = useMemo(() => bookings.filter((b) => b.bookingDate === today), [bookings, today]);
  const upcoming7 = useMemo(
    () => bookings.filter((b) => b.bookingDate && b.bookingDate > today && isUpcomingWithin(b.bookingDate, 7)),
    [bookings, today],
  );
  const recent = useMemo(() => [...bookings].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 6), [bookings]);

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          {settings.logoDataUrl && (
            <img
              src={settings.logoDataUrl}
              alt="FUN FARMHOUSE"
              className="h-12 md:h-14 w-auto max-w-[220px] object-contain mb-3"
              data-testid="dashboard-logo"
            />
          )}
          <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">Overview</p>
          <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Welcome back to <span className="text-emerald-400">FUN FARMHOUSE</span>
          </h1>
          <p className="mt-1 text-gray-400 text-sm">
            {settings.address ? settings.address : "Your bookings, at a glance."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/ai-booking"
            data-testid="dashboard-ai-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Booking Assistant
          </Link>
          <Link
            to="/bookings/new"
            data-testid="dashboard-new-booking-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1F2937] hover:bg-[#374151] text-white text-sm font-medium border border-[#374151] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Booking
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        <StatCard label="Total Bookings" value={stats.total} icon={CalendarDays} accent="violet" testId="stat-total" delay={0.02} />
        <StatCard label="Today" value={stats.todays} icon={CalendarCheck} accent="emerald" testId="stat-today" delay={0.06} />
        <StatCard label="Next 7 Days" value={stats.upcoming} icon={Clock3} accent="blue" testId="stat-upcoming" delay={0.1} />
        <StatCard label="Total Revenue" value={formatPKR(stats.revenue)} icon={Coins} accent="amber" testId="stat-revenue" delay={0.14} />
        <StatCard label="Pending Payments" value={formatPKR(stats.pending)} icon={Wallet} accent="rose" testId="stat-pending" delay={0.18} />
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="rounded-xl border border-[#374151] bg-[#1F2937] p-5 md:p-6"
      >
        <h2 className="font-heading text-lg text-white">Quick actions</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/ai-booking" data-testid="quick-ai-btn" className="group flex items-center gap-3 p-4 rounded-lg bg-[#111827] border border-[#374151] hover:border-emerald-500/40 transition-colors">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
            <div>
              <p className="text-sm font-medium text-white">AI Booking Assistant</p>
              <p className="text-xs text-gray-400">Paste customer text → auto-fill</p>
            </div>
          </Link>
          <Link to="/backup" data-testid="quick-export-btn" className="group flex items-center gap-3 p-4 rounded-lg bg-[#111827] border border-[#374151] hover:border-blue-500/40 transition-colors">
            <div className="w-9 h-9 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center"><DatabaseBackup className="w-4 h-4" /></div>
            <div>
              <p className="text-sm font-medium text-white">Backup Export</p>
              <p className="text-xs text-gray-400">Download JSON snapshot</p>
            </div>
          </Link>
          <Link to="/backup" data-testid="quick-import-btn" className="group flex items-center gap-3 p-4 rounded-lg bg-[#111827] border border-[#374151] hover:border-amber-500/40 transition-colors">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center"><Upload className="w-4 h-4" /></div>
            <div>
              <p className="text-sm font-medium text-white">Backup Import</p>
              <p className="text-xs text-gray-400">Restore from JSON</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Today */}
      <section>
        <SectionHeader title="Today's bookings" count={todays.length} />
        {todays.length === 0 ? (
          <EmptyState title="No bookings today" description="Your evening is free ✨" icon={Inbox} testId="empty-today" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todays.map((b) => (
              <BookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section>
        <SectionHeader title="Upcoming (next 7 days)" count={upcoming7.length} />
        {upcoming7.length === 0 ? (
          <EmptyState title="No upcoming bookings" description="Use the AI Assistant to add a new booking fast." testId="empty-upcoming" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming7.map((b) => (
              <BookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Recent */}
      <section>
        <SectionHeader title="Recent bookings" count={recent.length} to="/bookings" />
        {recent.length === 0 ? (
          <EmptyState title="No bookings yet" description="Start with the AI Booking Assistant." testId="empty-recent" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((b) => (
              <BookingCard key={b.bookingId} booking={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, count, to }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="text-xs text-gray-400 mt-1">{count} {count === 1 ? "record" : "records"}</p>
      </div>
      {to && (
        <Link to={to} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          View all →
        </Link>
      )}
    </div>
  );
}
