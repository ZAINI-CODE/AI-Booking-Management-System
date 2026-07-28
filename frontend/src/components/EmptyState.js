import { Inbox } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description = "Data will appear when available.", icon: Icon = Inbox, action = null, testId = "empty-state" }) {
  return (
    <div className="rounded-xl border border-dashed border-[#374151] bg-[#1F2937]/40 p-10 text-center" data-testid={testId}>
      <div className="mx-auto w-12 h-12 rounded-full bg-[#111827] border border-[#374151] flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="mt-4 font-heading text-lg text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
