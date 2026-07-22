import { Sparkles, Building2, GitBranch, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home({ companyCount, branchCount }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center max-w-3xl mx-auto">
        {/* Modern decorative badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-6">
          <Sparkles size={12} className="animate-pulse" />
          <span>NIB Account Management Portal</span>
        </div>

        {/* Large Premium Typography */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
          Streamlined Corporate <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Account Structure
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-10">
          Easily organize companies, map complex branch layouts, and extract comprehensive data statements in a secure cloud ecosystem.
        </p>

        {/* Grid of quick stats or options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
          {/* Card 1: Companies */}
          <div 
            onClick={() => navigate('/accounts/masters/insurers')}
            className="group bg-white p-6 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-900/5 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 cursor-pointer transition-all duration-300 flex items-start gap-4 text-left"
          >
            <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shadow-inner shadow-blue-100/50">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                Insurer Master
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">
                Register insurers and manage company profiles.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-blue-600">
                <span>{companyCount} Registered</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Branches */}
          <div 
            onClick={() => navigate('/accounts/masters/insurer-branches')}
            className="group bg-white p-6 rounded-2xl border border-blue-100/50 shadow-sm shadow-blue-900/5 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 cursor-pointer transition-all duration-300 flex items-start gap-4 text-left"
          >
            <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shadow-inner shadow-blue-100/50">
              <GitBranch size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                Insurer Branch Master
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">
                Create insurer branches and map office locations.
              </p>
              <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-blue-600">
                <span>{branchCount} Branches</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Secure seal */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Authorized Access Only • AES-256 Encryption Standard</span>
        </div>
      </div>
    </div>
  );
}

