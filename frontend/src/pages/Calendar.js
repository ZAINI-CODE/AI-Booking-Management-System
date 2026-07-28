import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { useBookings } from "@/context/BookingContext";
import { todayISO } from "@/utils/dateHelpers";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Static tailwind classes so purge keeps them
const FARM_COLORS = [
  { chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20" },
  { chip: "bg-blue-500/15 text-blue-300 border-blue-500/20" },
  { chip: "bg-amber-500/15 text-amber-300 border-amber-500/20" },
  { chip: "bg-violet-500/15 text-violet-300 border-violet-500/20" },
  { chip: "bg-rose-500/15 text-rose-300 border-rose-500/20" },
  { chip: "bg-sky-500/15 text-sky-300 border-sky-500/20" },
  { chip: "bg-teal-500/15 text-teal-300 border-teal-500/20" },
  { chip: "bg-orange-500/15 text-orange-300 border-orange-500/20" },
];

function hashIdx(str, n) {
  let h = 0;
  for (const c of String(str || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

function toISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Calendar() {
  const { bookings } = useBookings();
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedISO, setSelectedISO] = useState(todayISO());

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const startWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      if (!b.bookingDate) continue;
      (map[b.bookingDate] ||= []).push(b);
    }
    return map;
  }, [bookings]);

  const todayStr = todayISO();
  const selected = selectedISO ? bookingsByDate[selectedISO] || [] : [];

  const shift = (delta) => setCursor(new Date(y, m + delta, 1));

  return (
    <div className="space-y-6" data-testid="calendar-page">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">Schedule</p>
          <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Calendar
          </h1>
          <p className="mt-1 text-gray-400 text-sm">Month view of every farmhouse reservation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            data-testid="calendar-prev"
            className="p-2 rounded-md bg-[#1F2937] border border-[#374151] hover:bg-[#374151] text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="min-w-[180px] text-center font-heading text-lg text-white"
            data-testid="calendar-month"
          >
            {monthLabel}
          </div>
          <button
            onClick={() => shift(1)}
            data-testid="calendar-next"
            className="p-2 rounded-md bg-[#1F2937] border border-[#374151] hover:bg-[#374151] text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedISO(todayStr);
            }}
            data-testid="calendar-today"
            className="ml-2 px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-sm text-white transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-[#1F2937] border border-[#374151] overflow-hidden">
        <div className="grid grid-cols-7 text-[11px] uppercase text-gray-400 tracking-wider bg-[#111827]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 border-b border-r border-[#374151] text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const iso = d ? toISO(d) : null;
            const isToday = iso === todayStr;
            const isSelected = iso && iso === selectedISO;
            const dayBookings = iso ? bookingsByDate[iso] || [] : [];
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => iso && setSelectedISO(iso)}
                data-testid={iso ? `cal-day-${iso}` : undefined}
                className={[
                  "min-h-[92px] p-2 border-b border-r border-[#374151] text-left align-top transition-colors",
                  !d ? "bg-[#111827]/40 cursor-default" : "hover:bg-[#111827] cursor-pointer",
                  isSelected ? "bg-emerald-500/10" : "",
                ].join(" ")}
              >
                {d && (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono ${
                          isToday ? "text-emerald-400 font-bold" : "text-gray-400"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 rounded bg-emerald-500/20 text-emerald-300">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayBookings.slice(0, 2).map((b) => {
                        const c = FARM_COLORS[hashIdx(b.farmName, FARM_COLORS.length)];
                        return (
                          <div
                            key={b.bookingId}
                            className={`text-[10px] truncate px-1.5 py-0.5 rounded border ${c.chip}`}
                          >
                            {b.farmName}
                          </div>
                        );
                      })}
                      {dayBookings.length > 2 && (
                        <div className="text-[9px] text-gray-500">+{dayBookings.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedISO && (
        <div className="rounded-xl bg-[#1F2937] border border-[#374151] p-5" data-testid="calendar-day-panel">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-heading text-lg text-white">
                {new Date(selectedISO + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{selected.length} booking(s)</p>
            </div>
            <Link
              to="/bookings/new"
              state={{ draft: { bookingDate: selectedISO } }}
              data-testid="calendar-new-on-day"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> New on this day
            </Link>
          </div>

          {selected.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No bookings this day — the day is free.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {selected.map((b) => (
                <Link
                  key={b.bookingId}
                  to={`/bookings/${b.bookingId}/edit`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md bg-[#111827] border border-[#374151] hover:border-emerald-500/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {b.farmName} · {b.customerName || "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.slotTiming || b.timeSlot} · {b.guests || 0} guests
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">{b.bookingId}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
