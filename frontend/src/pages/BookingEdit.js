import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import { useBookings } from "@/context/BookingContext";

export default function BookingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getById } = useBookings();

  const existing = id ? getById(id) : null;
  const isNew = !existing;
  const initialDraft = location.state?.draft || null;

  return (
    <div className="max-w-4xl" data-testid="booking-edit-page">
      <button
        onClick={() => navigate(-1)}
        data-testid="back-btn"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">
        {isNew ? "New Reservation" : "Edit Reservation"}
      </p>
      <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">
        {isNew ? "Create Booking" : existing.customerName || "Booking"}
      </h1>
      {!isNew && existing?.bookingId && (
        <p className="mt-1 text-xs text-gray-500 font-mono">{existing.bookingId}</p>
      )}

      <div className="mt-6 rounded-xl bg-[#1F2937] border border-[#374151] p-5 md:p-7">
        <BookingForm existing={existing} initialDraft={initialDraft} />
      </div>
    </div>
  );
}
