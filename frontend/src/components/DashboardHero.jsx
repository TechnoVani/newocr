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
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-slate-950/5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-6 text-white shadow-md sm:px-8">
      {/* Background Decorative Blurs */}
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
      
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-blue-400">{eyebrow}</p>
          <h1 className="text-2xl font-black sm:text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200">
            {getGreeting(currentTime.getHours())}, {firstName}
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs font-semibold text-slate-300 sm:text-sm leading-relaxed">{description}</p>
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            <ActionIcon className="w-4 h-4" /> {actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
