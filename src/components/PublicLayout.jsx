import { Outlet } from "react-router-dom";
import Footer from "./Footer";

export default function PublicLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="flex min-h-0 flex-1 flex-col"><Outlet /></main>
      <Footer />
    </div>
  );
}
