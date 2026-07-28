import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, Trash2, DatabaseBackup } from "lucide-react";
import { exportBackup, importBackup } from "@/utils/backup";
import { useBookings } from "@/context/BookingContext";

export default function Backup() {
  const { bookings, clearAll, restoreAll } = useBookings();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    exportBackup();
    toast.success("Backup downloaded");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const summary = await importBackup(file);
      // Refresh from LS: read from localStorage so context picks up new state
      const raw = localStorage.getItem("ff_bookings_v1");
      if (raw) restoreAll(JSON.parse(raw));
      toast.success(`Imported ${summary.bookings} bookings`);
    } catch (err) {
      toast.error("Import failed: " + (err?.message || "unknown"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = () => {
    if (!window.confirm("Delete ALL bookings? This cannot be undone.")) return;
    clearAll();
    toast.success("All bookings cleared");
  };

  return (
    <div className="max-w-3xl space-y-6" data-testid="backup-page">
      <div>
        <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">Data</p>
        <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">Backup & Restore</h1>
        <p className="mt-1 text-gray-400 text-sm">Your bookings live in this browser&apos;s LocalStorage. Export a snapshot regularly to stay safe.</p>
      </div>

      <div className="rounded-xl bg-[#1F2937] border border-[#374151] p-5 md:p-7">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DatabaseBackup className="w-5 h-5" />
          </div>
          <div>
            <p className="font-heading text-white">Current dataset</p>
            <p className="text-sm text-gray-400">{bookings.length} bookings stored</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            data-testid="backup-export-btn"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            data-testid="backup-import-btn"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#111827] hover:bg-[#374151] text-white text-sm font-medium border border-[#374151] transition-colors"
          >
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImport} data-testid="backup-file-input" />
          <button
            onClick={handleClear}
            data-testid="backup-clear-btn"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-transparent hover:bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#374151] bg-[#1F2937]/50 p-5 text-sm text-gray-400">
        <p className="text-gray-300 font-medium">LocalStorage keys used</p>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          <li>ff_bookings_v1 — all reservations</li>
          <li>ff_settings_v1 — business info & logo</li>
        </ul>
      </div>
    </div>
  );
}
