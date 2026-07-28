import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, accent = "emerald", testId, delay = 0 }) {
  const accents = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl bg-[#1F2937] border border-[#374151] p-6 hover:border-[#4B5563] transition-colors"
      data-testid={testId}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">{label}</p>
          <p className="mt-3 font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${accents[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
