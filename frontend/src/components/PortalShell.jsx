import { Outlet } from "react-router-dom";
import Footer from "./Footer";

export default function PortalShell() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50/50">
      <div className="flex min-h-0 flex-1 flex-col"><Outlet /></div>
      <Footer />
    </div>
  );
}
