import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "../../../components/Footer";

export default function OperationsLayout() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <Navbar />
      <main className="flex min-h-0 w-full flex-1 flex-col"><Outlet /></main>
      <Footer />
    </div>
  );
}
