import { Link } from "react-router-dom";
import { Calendar, Clock, Users, Phone, Building2 } from "lucide-react";
import { formatPrettyDate } from "@/utils/dateHelpers";
import { formatPKR } from "@/utils/currency";

export default function BookingCard({ booking, compact = false }) {
  const remaining = Math.max(Number(booking.totalAmount || 0) - Number(booking.advancePaid || 0), 0);
  return (
    <Link
      to={`/bookings/${booking.bookingId}/edit`}
      data-testid={`booking-card-${booking.bookingId}`}
      className="block rounded-xl bg-[#1F2937] border border-[#374151] p-5 hover:border-emerald-500/40 hover:-translate-y-[1px] transition-transform duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="font-heading font-semibold text-white truncate">{booking.farmName || "—"}</p>
          </div>
          <p className="mt-1 text-sm text-gray-300 truncate">{booking.customerName || "Unnamed guest"}</p>
        </div>
        <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded-md bg-[#111827] border border-[#374151] text-gray-400">
          {booking.bookingId}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-300">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="truncate">{formatPrettyDate(booking.bookingDate)}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="truncate">{booking.slotTiming || booking.timeSlot || "—"}</span>
        </div>
        {!compact && (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{booking.guests || 0} guests</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="truncate">{booking.phone || "—"}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[#374151] flex items-center justify-between text-xs">
        <span className="text-gray-400">{booking.eventType || "Booking"}</span>
        <div className="text-right">
          <p className="text-gray-400">Remaining</p>
          <p className="font-heading font-semibold text-emerald-400">{formatPKR(remaining)}</p>
        </div>
      </div>
    </Link>
  );
}
