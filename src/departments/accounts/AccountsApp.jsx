import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AccountsNavbar from "./AccountsNavbar";
import Home from "./pages/Home";
import CreateCompany from "./pages/CreateCompany";
import CreateBranch from "./pages/CreateBranch";
import InsurerWiseReport from "./pages/reports/InsurerWiseReport";
import InsuredWiseReport from "./pages/reports/InsuredWiseReport";
import VerifyReport from "./pages/reports/VerifyReport";
import Profile from "../../pages/Profile";
import { accountsApi } from "./api";

const readLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};

export default function AccountsApp() {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [dbStatus, setDbStatus] = useState("checking");

  const loadData = useCallback(async () => {
    setDbStatus("checking");
    try {
      const [nextCompanies, nextBranches] = await Promise.all([accountsApi.companies(), accountsApi.branches()]);
      setCompanies(Array.isArray(nextCompanies) ? nextCompanies : []);
      setBranches(Array.isArray(nextBranches) ? nextBranches : []);
      setDbStatus("connected");
    } catch (error) {
      console.error("Accounts API unavailable:", error);
      setCompanies(readLocal("nib_companies"));
      setBranches(readLocal("nib_branches"));
      setDbStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    // Initial remote synchronization for the Accounts module.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);
  useEffect(() => { if (dbStatus === "disconnected") localStorage.setItem("nib_companies", JSON.stringify(companies)); }, [companies, dbStatus]);
  useEffect(() => { if (dbStatus === "disconnected") localStorage.setItem("nib_branches", JSON.stringify(branches)); }, [branches, dbStatus]);

  const addCompany = async (company) => {
    if (dbStatus === "connected") { await accountsApi.createCompany(company); await loadData(); }
    else setCompanies((current) => [{ ...company, id: Date.now(), status: company.status || "Active" }, ...current]);
    return true;
  };
  const updateCompany = async (id, company) => {
    if (dbStatus === "connected") { await accountsApi.updateCompany(id, company); await loadData(); }
    else {
      const previous = companies.find((item) => String(item.id) === String(id));
      setCompanies((current) => current.map((item) => String(item.id) === String(id) ? { ...item, ...company } : item));
      if (previous && previous.insurer !== company.insurer) {
        setBranches((current) => current.map((item) => item.insurer === previous.insurer ? { ...item, insurer: company.insurer } : item));
      }
      if (company.status === "Inactive") {
        setBranches((current) => current.map((item) => item.insurer === company.insurer || item.insurer === previous?.insurer ? { ...item, status: "Inactive" } : item));
      }
    }
    return true;
  };
  const changeCompanyStatus = async (id, status) => {
    if (dbStatus === "connected") { await accountsApi.updateCompanyStatus(id, status); await loadData(); }
    else {
      const company = companies.find((item) => String(item.id) === String(id));
      setCompanies((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status } : item));
      if (status === "Inactive" && company) {
        setBranches((current) => current.map((item) => item.insurer === company.insurer ? { ...item, status: "Inactive" } : item));
      }
    }
    return true;
  };
  const addBranch = async (branch) => {
    if (dbStatus === "connected") { await accountsApi.createBranch(branch); await loadData(); }
    else setBranches((current) => [{ ...branch, id: Date.now(), status: branch.status || "Active" }, ...current]);
    return true;
  };
  const updateBranch = async (id, branch) => {
    if (dbStatus === "connected") { await accountsApi.updateBranch(id, branch); await loadData(); }
    else setBranches((current) => current.map((item) => String(item.id) === String(id) ? { ...item, ...branch } : item));
    return true;
  };
  const changeBranchStatus = async (id, status) => {
    if (status === "Active") {
      const branch = branches.find((item) => String(item.id) === String(id));
      const company = companies.find((item) => item.insurer === branch?.insurer);
      if (!company || company.status === "Inactive") throw new Error("Activate the insurer company before activating this branch.");
    }
    if (dbStatus === "connected") { await accountsApi.updateBranchStatus(id, status); await loadData(); }
    else setBranches((current) => current.map((item) => String(item.id) === String(id) ? { ...item, status } : item));
    return true;
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-slate-50 text-slate-800">
      <AccountsNavbar />
      <Routes>
        <Route index element={<Home companyCount={companies.length} branchCount={branches.length} />} />
        <Route path="reports/insurer-wise" element={<InsurerWiseReport />} />
        <Route path="reports/insured-wise" element={<InsuredWiseReport />} />
        <Route path="reports/verify" element={<VerifyReport />} />
        <Route path="masters/insurers" element={<CreateCompany companies={companies} onAddCompany={addCompany} onUpdateCompany={updateCompany} onChangeStatus={changeCompanyStatus} />} />
        <Route path="masters/insurer-branches" element={<CreateBranch branches={branches} companies={companies} onAddBranch={addBranch} onUpdateBranch={updateBranch} onChangeStatus={changeBranchStatus} />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/accounts" replace />} />
      </Routes>
    </div>
  );
}
