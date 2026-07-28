import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Plus, X, Save } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function Settings() {
  const { settings, updateSettings, addFarm, removeFarm } = useSettings();
  const [form, setForm] = useState({
    phone: settings.phone || "",
    whatsapp: settings.whatsapp || "",
    address: settings.address || "",
    tagline: settings.tagline || "",
    defaultNote: settings.defaultNote || "",
  });
  const [newFarm, setNewFarm] = useState("");
  const fileRef = useRef(null);

  const inputCls =
    "w-full bg-[#111827] border border-[#374151] rounded-md px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors";
  const labelCls = "block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider";

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/i.test(file.type)) {
      toast.error("Please upload a PNG, JPG, SVG or WEBP image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ logoDataUrl: String(reader.result || "") });
      toast.success("Logo uploaded");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoDataUrl: "" });
    toast.success("Logo removed");
  };

  const handleSave = () => {
    updateSettings(form);
    toast.success("Settings saved");
  };

  return (
    <div className="max-w-3xl space-y-6" data-testid="settings-page">
      <div>
        <p className="text-sm text-emerald-400 font-medium tracking-wider uppercase">Configuration</p>
        <h1 className="mt-1 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-gray-400 text-sm">Business info shown on receipts and inside the app.</p>
      </div>

      {/* Logo */}
      <div className="rounded-xl bg-[#1F2937] border border-[#374151] p-5 md:p-7">
        <h2 className="font-heading text-lg text-white">Brand Logo</h2>
        <p className="text-sm text-gray-400 mt-1">
          Upload your official <span className="text-emerald-400 font-medium">FUN FARMHOUSE</span> logo. It appears in the sidebar, header, receipt, PDF and print view. Until uploaded, the text placeholder &ldquo;FUN FARMHOUSE&rdquo; is used.
        </p>
        <div className="mt-4 flex items-center gap-6">
          <div className="w-40 h-24 rounded-lg border border-dashed border-[#374151] bg-[#111827] flex items-center justify-center overflow-hidden">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="Logo" className="max-w-full max-h-full object-contain" data-testid="settings-logo-preview" />
            ) : (
              <span className="font-heading font-bold text-sm text-emerald-400">FUN FARMHOUSE</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} data-testid="logo-file-input" />
            <button
              onClick={() => fileRef.current?.click()}
              data-testid="upload-logo-btn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload logo
            </button>
            {settings.logoDataUrl && (
              <button
                onClick={handleRemoveLogo}
                data-testid="remove-logo-btn"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-rose-400 hover:bg-rose-500/10 text-sm border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
            <p className="text-xs text-gray-500">PNG / JPG / SVG · under 1 MB</p>
          </div>
        </div>
      </div>

      {/* Business info */}
      <div className="rounded-xl bg-[#1F2937] border border-[#374151] p-5 md:p-7">
        <h2 className="font-heading text-lg text-white">Business Info</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Business Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} data-testid="settings-phone" placeholder="+92 300 000 0000" />
          </div>
          <div>
            <label className={labelCls}>WhatsApp Number</label>
            <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} data-testid="settings-whatsapp" placeholder="+92 300 000 0000" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} data-testid="settings-address" placeholder="Main GT Road, Lahore" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Receipt Tagline</label>
            <input className={inputCls} value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} data-testid="settings-tagline" placeholder="Luxury Event Venue &amp; Swimming Pool" />
            <p className="mt-1 text-[11px] text-gray-500">Shown as a small line under your farmhouse name on the receipt.</p>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Default Receipt Note</label>
            <textarea className={`${inputCls} min-h-[80px]`} value={form.defaultNote} onChange={(e) => setForm((f) => ({ ...f, defaultNote: e.target.value }))} data-testid="settings-default-note" />
          </div>
        </div>
        <button
          onClick={handleSave}
          data-testid="settings-save-btn"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" /> Save changes
        </button>
      </div>

      {/* Farmhouses */}
      <div className="rounded-xl bg-[#1F2937] border border-[#374151] p-5 md:p-7">
        <h2 className="font-heading text-lg text-white">Farmhouses</h2>
        <p className="text-sm text-gray-400 mt-1">Manage the list of your farmhouses (used in booking form auto-complete).</p>
        <div className="mt-4 flex items-center gap-2">
          <input
            className={inputCls}
            value={newFarm}
            onChange={(e) => setNewFarm(e.target.value)}
            placeholder="e.g. Sunset Farm"
            data-testid="new-farm-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (newFarm.trim()) { addFarm(newFarm); setNewFarm(""); toast.success("Farmhouse added"); }
              }
            }}
          />
          <button
            onClick={() => { if (newFarm.trim()) { addFarm(newFarm); setNewFarm(""); toast.success("Farmhouse added"); } }}
            data-testid="add-farm-btn"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {settings.farms.length === 0 && <p className="text-sm text-gray-500">No farmhouses yet.</p>}
          {settings.farms.map((f) => (
            <span key={f} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111827] border border-[#374151] text-sm text-white" data-testid={`farm-chip-${f}`}>
              {f}
              <button
                onClick={() => { removeFarm(f); toast.success("Removed"); }}
                data-testid={`remove-farm-${f}`}
                className="text-gray-400 hover:text-rose-400 transition-colors"
                aria-label={`Remove ${f}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
