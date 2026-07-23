// src/components/UploadSection.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { CloudUpload } from 'lucide-react';
import Loader from '../../../pages/Loader';
import PolicyListingModal from './PolicyListingModal';
import PolicyCardWrapper from './PolicyCardWrapper';
import {
  clearMotorDrafts,
  readMotorPolicyDraft,
  saveMotorPolicyDraft,
} from '../services/motorDraftStorage';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

// -------- PARSER LOGIC (unchanged) --------
function parseBajajPolicy(text) {
  const data = {};

  const extractQuoted = (label) => {
    const regex = new RegExp(`"${label}"\\s*,\\s*"(?:\\s*:?\\s*)(.*?)"`, 'i');
    const match = text.match(regex);
    return match ? match[1].replace(/\\n/g, ' ').trim() : 'N/A';
  };

  data.proposerName = extractQuoted('1\\. Proposer Name');
  data.proposerAddress = extractQuoted('2\\. Proposer Address');
  data.proposerMobile = extractQuoted('3\\. Proposer Mobile Number');
  data.proposerEmail = extractQuoted('5\\. Proposer e-mail id');

  const vehicleRowRegex = /"([A-Z]{2}[0-9]{1,2}[A-Z]*[0-9]{4})"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"(\d+)"\s*,\s*"(\d{4})[\s\S]*?(\d+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/;
  const vehicleMatch = text.match(vehicleRowRegex);
  
  if (vehicleMatch) {
    data.registrationNumber = vehicleMatch[1];
    data.vehicleMake = vehicleMatch[2].replace(/\n/g, ' ').trim();
    data.vehicleSubType = vehicleMatch[3].replace(/\n/g, ' ').trim();
    data.vehicleModel = vehicleMatch[4].replace(/\n/g, ' ').trim();
    data.ccKw = vehicleMatch[5];
    data.manufacturingYear = vehicleMatch[6];
    data.seatingCapacity = vehicleMatch[7];
    data.chassisNumber = vehicleMatch[8].replace(/\s/g, '');
    data.engineNumber = vehicleMatch[9].replace(/\s/g, '');
  } else {
    data.registrationNumber = 'N/A';
    data.vehicleMake = 'N/A';
    data.vehicleSubType = 'N/A';
    data.vehicleModel = 'N/A';
    data.ccKw = 'N/A';
    data.manufacturingYear = 'N/A';
    data.seatingCapacity = 'N/A';
    data.chassisNumber = 'N/A';
    data.engineNumber = 'N/A';
  }

  const idvRowRegex = /"(DIESEL|PETROL|CNG|EV)"\s*,\s*"([\d,\.]+)"[\s\S]*?,\s*"([\d,\.]+)"/i;
  const idvMatch = text.match(idvRowRegex);
  if (idvMatch) {
    data.fuelType = idvMatch[1];
    data.idv = idvMatch[2].replace(/,/g, '');
    data.totalSumInsured = idvMatch[3].replace(/,/g, '');
  } else {
    data.fuelType = 'N/A';
    data.idv = 'N/A';
    data.totalSumInsured = 'N/A';
  }

  const periodMatch = text.match(/1\.\s*Period of Insurance[\s\S]*?From\s*([^To\n]+)To\s*([^"\n]+)/i);
  if (periodMatch) {
    data.periodFrom = periodMatch[1].replace(':', '').trim();
    data.periodTo = periodMatch[2].trim();
  } else {
    data.periodFrom = 'N/A';
    data.periodTo = 'N/A';
  }

  const liabPremMatch = text.match(/Premium for Liability coverage, quoted and agreed upon is[\s\S]*?(?:Rs\.|:)\s*([\d,]+)/i);
  data.liabilityPremium = liabPremMatch ? liabPremMatch[1].replace(/,/g, '') : 'N/A';

  const odPremMatch = text.match(/Premium for OD coverage, quoted and agreed upon is[\s\S]*?(?:Rs\.|:)\s*([\d,]+)/i);
  data.odPremium = odPremMatch ? odPremMatch[1].replace(/,/g, '') : 'N/A';

  const totalPremMatch = text.match(/Total Premium.*?agreed upon is\s*(?:Rs\.)?([\d,]+)/i);
  data.totalPremium = totalPremMatch ? totalPremMatch[1].replace(/,/g, '') : 'N/A';

  const ncbMatch = text.match(/NCB \(No Claim Bonus\)[\s\S]*?:(-?\d+%)/i);
  data.ncb = ncbMatch ? ncbMatch[1] : 'N/A';

  const prevInsurerMatch = text.match(/Previous Insurer\s*-\s*([^.]+)/i);
  data.previousInsurer = prevInsurerMatch ? prevInsurerMatch[1].trim() : 'N/A';

  const prevPolicyMatch = text.match(/Previous Policy No\s*-\s*([^\s]+)/i);
  data.previousPolicyNo = prevPolicyMatch ? prevPolicyMatch[1].trim() : 'N/A';

  return data;
}

// -------- MAIN COMPONENT --------
const UploadSection = ({ children, isSideBySide = false, motorProps = {} }) => {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState(() => {
    const savedPolicy = readMotorPolicyDraft();
    return savedPolicy ? [savedPolicy] : [];
  });
  const [modalOpen, setModalOpen] = useState(false);

  const handlePolicySubmitSuccess = (savedPolicy) => {
    clearMotorDrafts();
    setPolicies([]);
    setModalOpen(false);
    motorProps.onSubmitSuccess?.(savedPolicy);
  };

  const submitAwareMotorProps = {
    ...motorProps,
    onSubmitSuccess: handlePolicySubmitSuccess,
  };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n\n----- PAGE ${i} -----\n\n${pageText}`;
    }
    return fullText;
  };

  const processPDF = async (selectedFile) => {
    if (!selectedFile) return;
    try {
      setLoading(true);

      const restoredPolicy = policies[0];
      const isSameRestoredFile = restoredPolicy &&
        !restoredPolicy.rawFile &&
        restoredPolicy.fileName === selectedFile.name &&
        Number(restoredPolicy.fileSize) === selectedFile.size &&
        Number(restoredPolicy.lastModified) === selectedFile.lastModified;
      if (isSameRestoredFile) {
        setPolicies([{ ...restoredPolicy, rawFile: selectedFile }]);
        toast.success('Policy file reattached. Your saved changes are preserved.', { id: 'pdf-process' });
        return;
      }

      toast.loading('Extracting data...', { id: 'pdf-process' });
      
      const rawText = await extractTextFromPDF(selectedFile);
      if (!rawText?.trim()) throw new Error('No text extracted. Possibly scanned PDF.');

      const parsedData = parseBajajPolicy(rawText);
      const newPolicy = {
        id: Date.now(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        lastModified: selectedFile.lastModified,
        rawFile: selectedFile,
        fullText: rawText,
        parsed: parsedData,
      };
      
      clearMotorDrafts();
      motorProps.onNewPolicy?.();
      setPolicies([newPolicy]);
      saveMotorPolicyDraft(newPolicy);
      toast.success('Extracted successfully!', { id: 'pdf-process' });
    } catch (err) {
      console.error(err);
      toast.error(`Extraction failed: ${err.message}`, { id: 'pdf-process' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    processPDF(file);
    e.target.value = '';
  };

  const handleUploadAreaClick = (e) => {
    e.preventDefault();
    setModalOpen(true);
  };

  const handleModalUpload = () => {
    setModalOpen(false);
    document.getElementById('pdf-upload').click();
  };

  if (children) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8 items-start">
          {/* Left Column: Upload Button */}
          <div className="flex flex-col items-start justify-start space-y-4 lg:pl-8">
            <label
              htmlFor="pdf-upload"
              onClick={handleUploadAreaClick}
              className={`
                inline-flex items-center gap-3
                px-8 py-4
                rounded-2xl
                bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700
                text-white
                font-semibold
                shadow-lg
                hover:shadow-2xl
                transition-all
                duration-300
                hover:-translate-y-1
                cursor-pointer
                ${loading ? "opacity-60 pointer-events-none" : ""}
              `}
            >
              <CloudUpload className="w-6 h-6" />
              <div className="flex flex-col text-left leading-tight">
                <span>{loading ? "Processing PDF..." : "Upload Insurance Policy"}</span>
                <span className="text-xs text-blue-100">Click to Select PDF</span>
              </div>
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {loading && <div className="mt-2"><Loader /></div>}
            {!loading && policies.length > 0 && (
              <div className="text-emerald-700 text-xs font-semibold mt-2 px-3 py-1.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-2 max-w-[340px]">
                <span className="text-emerald-500 font-bold shrink-0 text-xs mt-0.5">✓</span>
                <span className="font-bold text-[9px] uppercase text-emerald-600 tracking-wider shrink-0 mt-0.5">Uploaded:</span>
                <span className="break-words text-slate-700 font-semibold text-[11px]" title={policies[0].fileName}>
                  {policies[0].fileName}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Motor Entry Details (passed as children) */}
          <div className="w-full">{children}</div>
        </div>

        {/* Full-width parsed document details – pass motorProps to PolicyCardWrapper */}
        {!loading && policies.length > 0 && (
          <div className="mt-6 space-y-6">
            {policies.map((policy) => (
              <PolicyCardWrapper
                key={policy.id}
                item={policy}
                motorProps={submitAwareMotorProps}
              />
            ))}
          </div>
        )}

        <PolicyListingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onUpload={handleModalUpload}
        />
      </div>
    );
  }

  // Default: no children (single column with upload on top)
  return (
    <div className={isSideBySide ? "space-y-6" : "max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6"}>
      <div>
        <div className="flex justify-start items-center py-4">
          <label
            htmlFor="pdf-upload"
            onClick={handleUploadAreaClick}
            className={`
              inline-flex items-center gap-3
              px-8 py-4
              rounded-2xl
              bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
              hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700
              text-white
              font-semibold
              shadow-lg
              hover:shadow-2xl
              transition-all
              duration-300
              hover:-translate-y-1
              cursor-pointer
              ${loading ? "opacity-60 pointer-events-none" : ""}
            `}
          >
            <CloudUpload className="w-6 h-6" />
            <div className="flex flex-col leading-tight">
              <span>{loading ? "Processing PDF..." : "Upload Insurance Policy"}</span>
              <span className="text-xs text-blue-100">Click to Select PDF</span>
            </div>
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {loading && <Loader />}

        {!loading && policies.length > 0 && (
          <div className="mt-6 space-y-6">
            {policies.map((policy) => (
              <PolicyCardWrapper
                key={policy.id}
                item={policy}
                motorProps={submitAwareMotorProps}
              />
            ))}
          </div>
        )}

        {!loading && policies.length === 0 && (
          <div className="text-center text-slate-400 text-xs font-medium mt-12 py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            No policies uploaded yet. Select a PDF to begin.
          </div>
        )}
      </div>

      <PolicyListingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={handleModalUpload}
      />
    </div>
  );
};

export default UploadSection;
