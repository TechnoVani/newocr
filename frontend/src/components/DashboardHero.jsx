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
    <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d5cab] via-[#1676cc] to-[#29a1e6] px-6 py-8 text-white shadow-xl sm:px-9">
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[40px] border-white/10" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-100">{eyebrow}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {getGreeting(currentTime.getHours())}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-blue-100 sm:text-base">{description}</p>
        </div>
        {actionTo && (
          <Link
            to={actionTo}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            <ActionIcon size={18} /> {actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
