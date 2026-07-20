// src/components/PolicyListingModal.jsx
import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

const rawData = [
  { "company": "Bajaj", "vehicle": "Tw", "product": "" },
  { "company": "Bajaj", "vehicle": "Pvt Car", "product": "" },
  { "company": "Bajaj", "vehicle": "Commercial", "product": "Package {Bus}" },
  { "company": "GoDigit", "vehicle": "Tw", "product": "Package" },
  { "company": "GoDigit", "vehicle": "Pvt Car", "product": "Package, TP" },
  { "company": "GoDigit", "vehicle": "Commercial", "product": "" },
  { "company": "ICICI Lombard", "vehicle": "Tw", "product": "Bundle, Package" },
  { "company": "ICICI Lombard", "vehicle": "Pvt Car", "product": "OD, Package" },
  { "company": "ICICI Lombard", "vehicle": "Commercial", "product": "Package {CARRYING CAPACITY EXCEEDING 6}" },
  { "company": "Indus", "vehicle": "Tw", "product": "Bundle, Package, OD, TP" },
  { "company": "Indus", "vehicle": "Pvt Car", "product": "" },
  { "company": "Indus", "vehicle": "Commercial", "product": "Package {Passengers Carrying 3W<6}" },
  { "company": "Liberty", "vehicle": "Tw", "product": "" },
  { "company": "Liberty", "vehicle": "Pvt Car", "product": "Package" },
  { "company": "Liberty", "vehicle": "Commercial", "product": "" },
  { "company": "National", "vehicle": "Tw", "product": "Package" },
  { "company": "National", "vehicle": "Pvt Car", "product": "Package" },
  { "company": "National", "vehicle": "Commercial", "product": "TP {MISD}" },
  { "company": "New India", "vehicle": "Tw", "product": "Bundle, Package, OD, TP" },
  { "company": "New India", "vehicle": "Pvt Car", "product": "Bundle, Package, OD" },
  { "company": "New India", "vehicle": "Commercial", "product": "Package {(Other than 3 wheeler), } , TP{(Other than 3 wheeler), }" },
  { "company": "Oriental", "vehicle": "Tw", "product": "Bundle, TP" },
  { "company": "Oriental", "vehicle": "Pvt Car", "product": "Package" },
  { "company": "Oriental", "vehicle": "Commercial", "product": "Package{three wheeler, taxi}" },
  { "company": "Royal Sundaram", "vehicle": "Tw", "product": "TP" },
  { "company": "Royal Sundaram", "vehicle": "Pvt Car", "product": "" },
  { "company": "Royal Sundaram", "vehicle": "Commercial", "product": "Package {(Other than 3 wheeler), }" },
  { "company": "SBI", "vehicle": "Tw", "product": "OD" },
  { "company": "SBI", "vehicle": "Pvt Car", "product": "OD" },
  { "company": "SBI", "vehicle": "Commercial", "product": "" },
  { "company": "Shree Ram", "vehicle": "Tw", "product": "Bundle" },
  { "company": "Shree Ram", "vehicle": "Pvt Car", "product": "" },
  { "company": "Shree Ram", "vehicle": "Commercial", "product": "TP {(Taxi),}" },
  { "company": "Tata AIG", "vehicle": "Tw", "product": "" },
  { "company": "Tata AIG", "vehicle": "Pvt Car", "product": "OD, Package" },
  { "company": "Tata AIG", "vehicle": "Commercial", "product": "Package, TP" },
  { "company": "UNITED", "vehicle": "Tw", "product": "OD, TP" },
  { "company": "UNITED", "vehicle": "Pvt Car", "product": "Package{(Taxi),}, TP" },
  { "company": "UNITED", "vehicle": "Commercial", "product": "TP {Tractors}" }
];

const vehicleMap = {
  Tw: 'Two Wheeler',
  'Pvt Car': 'Pvt Car',
  Commercial: 'Commercial',
};

const PolicyListingModal = ({ open, onClose, onUpload }) => {
  const pivotData = useMemo(() => {
    const companies = {};
    rawData.forEach(({ company, vehicle, product }) => {
      if (!companies[company]) {
        companies[company] = { company };
      }
      const key = vehicleMap[vehicle] || vehicle;
      const cleanProduct = (product?.trim() === '' || product === '-')
        ? 'Any Type not provide policy'
        : product;
      companies[company][key] = cleanProduct;
    });
    return Object.values(companies);
  }, []);

  const getProductStyle = (product) => {
    if (product === 'Any Type not provide policy') {
      return 'bg-rose-50 text-rose-700 border border-rose-100/60 font-bold';
    }
    if (product.toLowerCase().includes('inprogress')) {
      return 'bg-amber-50 text-amber-700 border border-amber-100/60 font-bold';
    }
    return 'bg-emerald-50 text-emerald-700 border border-emerald-100/60 font-bold';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-5xl w-full max-h-[85vh] overflow-auto flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Supported Policies</h2>

        {/* Note / Warning */}
        <div className="mb-5 p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl text-xs text-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-amber-900">Important Note:</p>
              <ul className="list-disc list-inside space-y-1 mt-1.5 font-medium text-amber-800">
                <li>
                  <strong>Product type only:</strong> Data is processed based on product type.
                </li>
                <li>
                  <strong>Pre‑check required:</strong> Please verify all policy details before final submission.
                </li>
                <li>
                  <strong>Responsibility:</strong> You are fully responsible for any incorrect data submitted.
                </li>
                <li>
                  <strong>Incorrect data handling:</strong> If any policy data is incorrect, <span className="font-bold text-rose-600">do not submit</span>. 
                  Instead, provide the policy PDF to the IT team. The IT team will then verify and recreate the 
                  module on a company‑wise basis based on the policy.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 bg-emerald-50 border border-emerald-100 rounded-md"></span>
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 bg-amber-50 border border-amber-100 rounded-md"></span>
            In progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-3.5 bg-rose-50 border border-rose-100 rounded-md"></span>
            Not provided
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm flex-1">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Two Wheeler
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Pvt Car
                </th>
                <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Commercial
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-xs text-slate-600 font-medium">
              {pivotData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-400 text-center font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800">
                    {row.company}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] tracking-wide ${getProductStyle(row['Two Wheeler'])}`}>
                      {row['Two Wheeler'] || 'Any Type not provide policy'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] tracking-wide ${getProductStyle(row['Pvt Car'])}`}>
                      {row['Pvt Car'] || 'Any Type not provide policy'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] tracking-wide ${getProductStyle(row['Commercial'])}`}>
                      {row['Commercial'] || 'Any Type not provide policy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Close
          </button>
          <button
            onClick={onUpload}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)]"
          >
            Upload Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyListingModal;