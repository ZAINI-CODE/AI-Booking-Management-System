import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, PlusCircle, Filter } from "lucide-react";
import BookingCard from "@/components/BookingCard";
import EmptyState from "@/components/EmptyState";
import { useBookings } from "@/context/BookingContext";
import { todayISO } from "@/utils/dateHelpers";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

export default function Bookings() {
  const { bookings } = useBookings();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const results = useMemo(() => {
    const today = todayISO();
    return bookings
      .filter((b) => {
        if (filter === "today") return b.bookingDate === today;
        if (filter === "upcoming") return b.bookingDate && b.bookingDate > today;
        if (filter === "past") return b.bookingDate && b.bookingDate < today;
        return true;
      })
      .filter((b) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return [
          b.customerName, b.phone, b.farmName, b.bookingDate, b.timeSlot,
          b.slotTiming, b.eventType, b.notes, b.bookingId,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(s));
      })
      .sort((a, b) => (b.bookingDate || "").localeCompare(a.bookingDate || ""));
  }, [bookings, q, filter]);

  return (
    <div className="space-y-6" data-testid="bookings-page">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">Reservations</p>
          <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">Bookings</h1>
          <p className="mt-1 text-gray-400 text-sm">{bookings.length} total reservations</p>
        </div>
        <Link
          to="/bookings/new"
          data-testid="bookings-new-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone, farm, event…"
            data-testid="bookings-search-input"
            className="w-full pl-10 pr-3 py-2.5 rounded-md bg-[#1F2937] border border-[#374151] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#1F2937] border border-[#374151] no-scrollbar overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-500 mx-2 shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              data-testid={`filter-${f.key}`}
              className={[
                "px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.key ? "bg-emerald-500 text-white" : "text-gray-300 hover:bg-[#374151]",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title={q ? "No results" : "No bookings yet"}
          description={q ? "Try a different search term." : "Create your first booking with the AI Assistant."}
          testId="empty-bookings"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((b) => (
            <BookingCard key={b.bookingId} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
