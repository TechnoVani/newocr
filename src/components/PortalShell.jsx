import { Outlet } from "react-router-dom";

export default function PortalShell() {
  return <div className="flex min-h-[100dvh] flex-col bg-slate-50/50"><Outlet /></div>;
}
