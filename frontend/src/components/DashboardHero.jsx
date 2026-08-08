import { useEffect, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const getGreeting = (hour) => {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function DashboardHero({
  eyebrow = "Policy workspace overview",
  description = "Track your latest activity and keep today's work moving.",
  actionTo,
  actionLabel = "New Entry",
  actionIcon: ActionIcon = FilePlus2,
}) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm sm:px-5">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E88E5]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-600">{eyebrow}</p>
          <h1 className="text-xl font-black sm:text-2xl">
            {getGreeting(currentTime.getHours())}, {firstName}
          </h1>
          <p className="mt-1 max-w-3xl text-xs font-medium text-slate-500 sm:text-sm">{description}</p>
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-[#1E88E5] px-3.5 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-blue-700"
          >
            <ActionIcon size={15} /> {actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
