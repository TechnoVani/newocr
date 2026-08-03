import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function OperationsLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Navbar />
      <main className="flex min-h-0 w-full flex-1 flex-col"><Outlet /></main>
    </div>
  );
}
