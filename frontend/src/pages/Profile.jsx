import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { User, Mail, Phone, Calendar, MapPin, Award, BookOpen, Loader2, Edit3, ShieldAlert, UploadCloud, FileCheck2, FileUp, Eye, Landmark, Plus, Save, X, History, CreditCard, Camera } from "lucide-react";
import axiosInstance from "../config/axios";
import { loginSuccess } from "../redux/slices/authSlice";

const DOCUMENT_UPLOADS = [
  { name: "aadhaar_front", label: "Aadhaar Front" },
  { name: "aadhaar_back", label: "Aadhaar Back" },
  { name: "pan_card", label: "PAN Card" },
  { name: "marksheet", label: "Marksheet" },
  { name: "bank_passbook", label: "Bank Passbook" },
];

const EMPTY_ACCOUNT_FORM = {
  account_holder_name: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  branch_name: "",
  account_type: "",
};

const getRequestErrorMessage = async (error, fallback) => {
  const responseData = error.response?.data;
  if (responseData && typeof Blob !== "undefined" && responseData instanceof Blob) {
    try {
      const payload = JSON.parse(await responseData.text());
      return payload.message || fallback;
    } catch {
      return fallback;
    }
  }
  return responseData?.message || error.message || fallback;
};

// InfoRow and InfoField declared outside to prevent losing input focus during re-renders
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/50">
    {Icon && <Icon size={16} className="text-blue-500 mt-0.5 shrink-0 stroke-[1.5]" />}
    <div className="min-w-0 flex-1">
      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="block text-xs font-semibold text-slate-700 mt-0.5 break-words">{value || "-"}</span>
    </div>
  </div>
);

const InfoField = ({ label, name, value, type = "text", icon: Icon, options = null, isEditing, formData, handleInputChange, formatDate }) => {
  if (!isEditing) {
    const displayValue = type === "date" ? formatDate(value) : value;
    return <InfoRow label={label} value={displayValue} icon={Icon} />;
  }

  return (
    <div className="flex flex-col p-3 bg-white hover:bg-slate-50/50 rounded-xl transition-all border border-slate-200/80">
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center gap-2 min-h-[20px]">
        {Icon && <Icon size={14} className="text-slate-400 shrink-0 mt-0.5" />}
        {options ? (
          <select
            name={name}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer border-b border-transparent focus:border-slate-300 pb-0.5"
          >
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            name={name}
            value={formData[name] || ""}
            onChange={handleInputChange}
            rows={2}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none resize-none border-b border-transparent focus:border-slate-300"
          />
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name] || ""}
            onChange={handleInputChange}
            className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none border-b border-transparent focus:border-slate-300 pb-0.5"
          />
        )}
      </div>
    </div>
  );
};

const AccountDetailCard = ({ account, recent = false }) => (
  <article className={`rounded-2xl border p-5 shadow-sm ${recent ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white"}`}>
    <div className="flex items-start gap-3">
      <div className="min-w-0">
        <p className="truncate text-base font-extrabold text-slate-950">{account.bank_name}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">{account.account_type || "Account type not specified"}</p>
      </div>
    </div>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Account holder</dt>
        <dd className="mt-1 break-words text-sm font-bold text-slate-950">{account.account_holder_name}</dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Account number</dt>
        <dd className="mt-1 break-all font-mono text-sm font-bold text-slate-950">{account.account_number}</dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">IFSC code</dt>
        <dd className="mt-1 font-mono text-sm font-bold text-slate-950">{account.ifsc_code}</dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Branch</dt>
        <dd className="mt-1 break-words text-sm font-bold text-slate-950">{account.branch_name || "-"}</dd>
      </div>
    </dl>
  </article>
);

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const profilePictureObjectUrl = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [documentFiles, setDocumentFiles] = useState({});
  const [documentStatuses, setDocumentStatuses] = useState({});
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT_FORM);
  const [accountMessage, setAccountMessage] = useState({ type: "", text: "" });
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [profilePictureUploading, setProfilePictureUploading] = useState(false);
  const [profilePictureMessage, setProfilePictureMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/auth/me");
        if (response.data?.success) {
          const updatedUser = response.data.data.user;
          dispatch(loginSuccess({ token: localStorage.getItem("authToken"), user: updatedUser }));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    axiosInstance.get("/auth/profile/documents")
      .then((response) => {
        if (!active) return;
        const statuses = Object.fromEntries(
          (response.data?.data?.documents || []).map((document) => [document.type, document])
        );
        setDocumentStatuses(statuses);
      })
      .catch((err) => {
        if (active) setDocumentMessage(err.response?.data?.message || "Unable to load document status.");
      })
      .finally(() => { if (active) setDocumentsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    axiosInstance.get("/auth/profile/picture", { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(response.data);
        if (profilePictureObjectUrl.current) URL.revokeObjectURL(profilePictureObjectUrl.current);
        profilePictureObjectUrl.current = objectUrl;
        setProfilePictureUrl(objectUrl);
      })
      .catch(async (err) => {
        if (active && err.response?.status !== 404) {
          setProfilePictureMessage(await getRequestErrorMessage(err, "Unable to load profile picture."));
        }
      });

    return () => {
      active = false;
      if (profilePictureObjectUrl.current) {
        URL.revokeObjectURL(profilePictureObjectUrl.current);
        profilePictureObjectUrl.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    axiosInstance.get("/auth/profile/account-details")
      .then((response) => {
        if (!active) return;
        const loadedAccounts = response.data?.data?.accounts || [];
        setAccounts(loadedAccounts);
        if (loadedAccounts.length === 0) setAccountFormOpen(true);
      })
      .catch((err) => {
        if (active) {
          setAccountMessage({
            type: "error",
            text: err.response?.data?.message || "Unable to load account details.",
          });
        }
      })
      .finally(() => { if (active) setAccountsLoading(false); });
    return () => { active = false; };
  }, []);

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const startEditing = () => {
    setFormData({
      gender: user.gender || "",
      date_of_birth: formatDateForInput(user.date_of_birth),
      personal_email: user.personal_email || "",
      mobile: user.mobile || "",
      emergency_contact: user.emergency_contact || "",
      marital_status: user.marital_status || "",
      category: user.category || "",
      father_name: user.father_name || "",
      father_occupation: user.father_occupation || "",
      mother_name: user.mother_name || "",
      current_address: user.current_address || "",
      city: user.city || "",
      state: user.state || "",
      pin_code: user.pin_code || "",
      aadhaar_number: user.aadhaar_number || "",
      pan_number: user.pan_number || "",
      qualification: user.qualification || "",
      year_of_passing: user.year_of_passing || "",
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Limit mobile and emergency contact to 10 digits only (numbers only)
    if (name === "mobile" || name === "emergency_contact") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 10) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    // Limit pin_code to 6 digits only (numbers only)
    if (name === "pin_code") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 6) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    // Limit aadhaar_number to 12 digits only (numbers only)
    if (name === "aadhaar_number") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 12) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    // Limit pan_number to 10 characters (force uppercase)
    if (name === "pan_number") {
      if (value.length > 10) return;
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
      return;
    }

    // Limit year_of_passing to 4 digits only (numbers only)
    if (name === "year_of_passing") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 4) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Frontend validation: Ensure all fields are filled
    const requiredFields = [
      { name: "gender", label: "Gender" },
      { name: "date_of_birth", label: "Date of Birth" },
      { name: "personal_email", label: "Personal Email" },
      { name: "mobile", label: "Mobile" },
      { name: "emergency_contact", label: "Emergency Contact" },
      { name: "marital_status", label: "Marital Status" },
      { name: "category", label: "Category" },
      { name: "father_name", label: "Father's Name" },
      { name: "father_occupation", label: "Father's Occupation" },
      { name: "mother_name", label: "Mother's Name" },
      { name: "current_address", label: "Current Address" },
      { name: "city", label: "City" },
      { name: "state", label: "State" },
      { name: "pin_code", label: "Pin Code" },
      { name: "aadhaar_number", label: "Aadhaar Number" },
      { name: "pan_number", label: "PAN Number" },
      { name: "qualification", label: "Qualification" },
      { name: "year_of_passing", label: "Year of Passing" },
    ];

    for (const field of requiredFields) {
      if (!formData[field.name] || formData[field.name].toString().trim() === "") {
        alert(`Field "${field.label}" is required. Please fill it out.`);
        return;
      }
    }

    // Format & regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.personal_email.trim())) {
      alert("Please provide a valid personal email address.");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      alert("Mobile number must be a valid 10-digit number.");
      return;
    }

    if (!/^\d{10}$/.test(formData.emergency_contact.trim())) {
      alert("Emergency contact number must be a valid 10-digit number.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pin_code.trim())) {
      alert("Pin code must be a valid 6-digit number.");
      return;
    }

    if (!/^\d{12}$/.test(formData.aadhaar_number.trim())) {
      alert("Aadhaar number must be a valid 12-digit number.");
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.pan_number.trim().toUpperCase())) {
      alert("PAN number must be in a valid format (e.g. ABCDE1234F).");
      return;
    }

    const currentYear = new Date().getFullYear();
    const yop = parseInt(formData.year_of_passing, 10);
    if (isNaN(yop) || yop < 1950 || yop > currentYear + 5) {
      alert("Please provide a valid Year of Passing.");
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.put("/auth/profile", {
        ...formData,
        pan_number: formData.pan_number.trim().toUpperCase()
      });
      if (response.data?.success) {
        const updatedUser = response.data.data.user;
        dispatch(loginSuccess({ token: localStorage.getItem("authToken"), user: updatedUser }));
        setIsEditing(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentChange = (event, documentName) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setDocumentMessage("Only PDF, JPG, and PNG documents are allowed.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocumentMessage("Each document must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    setDocumentMessage("");
    setDocumentFiles((previous) => ({ ...previous, [documentName]: file }));
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedDocuments = Object.entries(documentFiles);
    if (!selectedDocuments.length) {
      setDocumentMessage("Select at least one document to upload.");
      return;
    }

    const payload = new FormData();
    selectedDocuments.forEach(([name, file]) => payload.append(name, file));
    try {
      setDocumentsUploading(true);
      setDocumentMessage("");
      const response = await axiosInstance.post("/auth/profile/documents", payload);
      const statuses = Object.fromEntries(
        (response.data?.data?.documents || []).map((document) => [document.type, document])
      );
      setDocumentStatuses(statuses);
      setDocumentFiles({});
      form.reset();
      setDocumentMessage("Documents uploaded successfully.");
    } catch (err) {
      setDocumentMessage(err.response?.data?.message || "Failed to upload documents.");
    } finally {
      setDocumentsUploading(false);
    }
  };

  const openDocumentPreview = (blob, title) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.title = title;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSelectedDocumentView = (file, label) => {
    if (file) openDocumentPreview(file, label);
  };

  const handleDocumentView = async (type, label) => {
    try {
      setDocumentMessage("");
      const response = await axiosInstance.get(`/auth/profile/documents/${type}`, {
        responseType: "blob",
      });
      openDocumentPreview(response.data, label);
    } catch (err) {
      setDocumentMessage(err.response?.data?.message || `Unable to view ${label}.`);
    }
  };

  const startAddingAccount = () => {
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setAccountMessage({ type: "", text: "" });
    setAccountFormOpen(true);
  };

  const cancelAccountForm = () => {
    setAccountFormOpen(false);
    setAccountForm(EMPTY_ACCOUNT_FORM);
  };

  const handleAccountInputChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "ifsc_code") nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    if (name === "account_number") nextValue = value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 50);
    setAccountForm((previous) => ({ ...previous, [name]: nextValue }));
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    const requiredFields = ["account_holder_name", "bank_name", "account_number", "ifsc_code"];
    if (requiredFields.some((field) => !accountForm[field].trim())) {
      setAccountMessage({ type: "error", text: "Please complete all required account fields." });
      return;
    }
    if (!/^[A-Za-z0-9-]{6,50}$/.test(accountForm.account_number.trim())) {
      setAccountMessage({ type: "error", text: "Enter a valid account number (6 to 50 characters)." });
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountForm.ifsc_code.trim().toUpperCase())) {
      setAccountMessage({ type: "error", text: "Enter a valid IFSC code, for example SBIN0001234." });
      return;
    }

    try {
      setAccountSaving(true);
      setAccountMessage({ type: "", text: "" });
      const payload = {
        ...accountForm,
        ifsc_code: accountForm.ifsc_code.trim().toUpperCase(),
      };
      const response = await axiosInstance.post("/auth/profile/account-details", payload);
      const savedAccount = response.data?.data?.account;
      setAccounts((previous) => [savedAccount, ...previous]);
      setAccountFormOpen(false);
      setAccountForm(EMPTY_ACCOUNT_FORM);
      setAccountMessage({
        type: "success",
        text: "New account details added successfully.",
      });
    } catch (err) {
      setAccountMessage({
        type: "error",
        text: err.response?.data?.message || "Unable to save account details.",
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setProfilePictureMessage("Profile picture must be a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfilePictureMessage("Profile picture must be 5 MB or smaller.");
      return;
    }

    try {
      setProfilePictureUploading(true);
      setProfilePictureMessage("");
      const payload = new FormData();
      payload.append("profile_picture", file);
      await axiosInstance.post("/auth/profile/picture", payload);
      const objectUrl = URL.createObjectURL(file);
      if (profilePictureObjectUrl.current) URL.revokeObjectURL(profilePictureObjectUrl.current);
      profilePictureObjectUrl.current = objectUrl;
      setProfilePictureUrl(objectUrl);
      dispatch(loginSuccess({
        token: localStorage.getItem("authToken"),
        user: { ...user, profile_picture_version: Date.now() },
      }));
      setProfilePictureMessage("Profile picture updated successfully.");
    } catch (err) {
      setProfilePictureMessage(await getRequestErrorMessage(err, "Unable to update profile picture."));
    } finally {
      setProfilePictureUploading(false);
    }
  };

  if (loading && (!user || !user.gender)) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Profile Details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-slate-400 italic">Please login to view your profile.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-in fade-in duration-200">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-[#1E88E5] relative" />
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
          <div className="relative w-28 h-28 rounded-full bg-white p-1.5 shadow-md flex-shrink-0 -mt-14 sm:-mt-14 z-10">
            <div className="w-full h-full overflow-hidden rounded-full bg-blue-50 text-[#1E88E5] flex items-center justify-center font-extrabold text-4xl border border-blue-100 ring-4 ring-blue-50">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={`${user.name || "Employee"} profile`} className="h-full w-full object-cover" />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : "U"
              )}
              {profilePictureUploading && (
                <span className="absolute inset-1.5 flex items-center justify-center rounded-full bg-slate-900/50 text-white">
                  <Loader2 size={24} className="animate-spin" />
                </span>
              )}
            </div>
            <label
              htmlFor="profile-picture-input"
              className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#1E88E5] text-white shadow-md transition hover:bg-[#1565C0]"
              title="Update profile picture"
            >
              <Camera size={16} />
              <span className="sr-only">Update profile picture</span>
            </label>
            <input
              id="profile-picture-input"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleProfilePictureChange}
              disabled={profilePictureUploading || !user.employee_code}
              className="sr-only"
            />
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0 sm:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">{user.name}</h1>
              <p className="text-sm font-bold text-[#1E88E5] mt-1 font-mono tracking-wide">
                EMPLOYEE CODE: {user.employee_code || "N/A"}
              </p>
              {profilePictureMessage && (
                <p className={`mt-1 text-[11px] font-semibold ${profilePictureMessage === "Profile picture updated successfully." ? "text-emerald-600" : "text-red-500"}`} role="status">
                  {profilePictureMessage}
                </p>
              )}
            </div>

            {/* Edit / Save Actions depending on document_status */}
            <div className="flex items-center justify-center sm:justify-end">
              {isEditing ? (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer focus:outline-none disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 border border-green-700 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              ) : user.document_status === "1" ? (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
                  <ShieldAlert size={14} className="stroke-[2]" />
                  <span>PROFILE LOCKED</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E88E5] hover:bg-[#1565C0] border border-blue-600 rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg focus:outline-none"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Personal Details */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>👤</span> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Gender" name="gender" value={user.gender} icon={User} options={["Male", "Female", "Other"]} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Date of Birth" name="date_of_birth" value={user.date_of_birth} type="date" icon={Calendar} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Personal Email" name="personal_email" value={user.personal_email} type="email" icon={Mail} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Mobile" name="mobile" value={user.mobile} type="tel" icon={Phone} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Emergency Contact" name="emergency_contact" value={user.emergency_contact} type="tel" icon={Phone} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Marital Status" name="marital_status" value={user.marital_status} icon={User} options={["Single", "Married", "Divorced", "Widowed"]} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Category" name="category" value={user.category} icon={User} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
            </div>
          </div>

          {/* Card 2: Family Details */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> Family Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Father's Name" name="father_name" value={user.father_name} icon={User} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Father's Occupation" name="father_occupation" value={user.father_occupation} icon={User} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Mother's Name" name="mother_name" value={user.mother_name} icon={User} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
            </div>
          </div>

          {/* Card 3: Address Details */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>📍</span> Address Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InfoField label="Current Address" name="current_address" value={user.current_address} type="textarea" icon={MapPin} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              </div>
              <InfoField label="City" name="city" value={user.city} icon={MapPin} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="State" name="state" value={user.state} icon={MapPin} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Pin Code" name="pin_code" value={user.pin_code} icon={MapPin} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
            </div>
          </div>
        </div>

        {/* Right Column - Professional & Other Details */}
        <div className="space-y-8">
          {/* Card 4: Professional Details (ALWAYS Read-Only) */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>💼</span> Professional Details (Locked)
            </h3>
            <div className="space-y-3">
              <InfoRow label="Designation" value={user.designation} icon={Award} />
              <InfoRow label="Department" value={user.department} icon={Award} />
              <InfoRow label="BQP" value={user.bqp} icon={Award} />
              <InfoRow label="Reporting Manager" value={user.reporting_manager} icon={Award} />
              <InfoRow label="Relationship Manager" value={user.relationship_manager} icon={Award} />
              <InfoRow label="Reporting Branch" value={user.reporting_branch} icon={Award} />
              <InfoRow label="Joining Date" value={formatDate(user.joining_date)} icon={Calendar} />
            </div>
          </div>

          {/* Card 5: Documents & Identity */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>🆔</span> Identity & Documents
            </h3>
            <div className="space-y-3">
              <InfoField label="Aadhaar Number" name="aadhaar_number" value={user.aadhaar_number} icon={BookOpen} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="PAN Number" name="pan_number" value={user.pan_number} icon={BookOpen} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
            </div>
          </div>

          {/* Card 6: Education */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>🎓</span> Educational Details
            </h3>
            <div className="space-y-3">
              <InfoField label="Qualification" name="qualification" value={user.qualification} icon={BookOpen} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
              <InfoField label="Year of Passing" name="year_of_passing" value={user.year_of_passing} icon={BookOpen} isEditing={isEditing} formData={formData} handleInputChange={handleInputChange} formatDate={formatDate} />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <Landmark size={18} className="text-blue-500" /> Account Details
            </h3>
            <p className="mt-1 text-xs text-slate-500">Add a new bank account. Previous records remain available as read-only details.</p>
          </div>
          {!accountFormOpen && (
            <button
              type="button"
              onClick={startAddingAccount}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E88E5] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1565C0]"
            >
              <Plus size={15} /> Add another account
            </button>
          )}
        </div>

        {accountMessage.text && (
          <p className={`mt-4 text-xs font-semibold ${accountMessage.type === "success" ? "text-emerald-600" : "text-red-500"}`} role="status">
            {accountMessage.text}
          </p>
        )}

        {accountFormOpen && (
          <form onSubmit={handleAccountSubmit} className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Add new account
              </h4>
              {accounts.length > 0 && (
                <button type="button" onClick={cancelAccountForm} disabled={accountSaving} className="text-slate-400 transition hover:text-slate-700" aria-label="Close account form">
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">
                Account holder name <span className="text-red-500">*</span>
                <input name="account_holder_name" value={accountForm.account_holder_name} onChange={handleAccountInputChange} maxLength={255} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Bank name <span className="text-red-500">*</span>
                <input name="bank_name" value={accountForm.bank_name} onChange={handleAccountInputChange} maxLength={255} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Account number <span className="text-red-500">*</span>
                <input name="account_number" value={accountForm.account_number} onChange={handleAccountInputChange} inputMode="numeric" autoComplete="off" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-blue-400" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                IFSC code <span className="text-red-500">*</span>
                <input name="ifsc_code" value={accountForm.ifsc_code} onChange={handleAccountInputChange} maxLength={11} placeholder="SBIN0001234" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs uppercase text-slate-800 outline-none focus:border-blue-400" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Branch name
                <input name="branch_name" value={accountForm.branch_name} onChange={handleAccountInputChange} maxLength={255} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400" />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Account type
                <select name="account_type" value={accountForm.account_type} onChange={handleAccountInputChange} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400">
                  <option value="">Select account type</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Salary">Salary</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              {accounts.length > 0 && (
                <button type="button" onClick={cancelAccountForm} disabled={accountSaving} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={accountSaving} className="inline-flex items-center gap-2 rounded-xl bg-[#1E88E5] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1565C0] disabled:opacity-50">
                {accountSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {accountSaving ? "Saving..." : "Save account"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6">
          {accountsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs font-semibold text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Loading account details...
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-5">
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <CreditCard size={15} /> Most recent account
                </h4>
                <AccountDetailCard account={accounts[0]} recent />
              </div>
              {accounts.length > 1 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <History size={15} /> Previous accounts ({accounts.length - 1})
                  </h4>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {accounts.slice(1).map((account) => (
                      <AccountDetailCard key={account.id} account={account} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !accountFormOpen ? (
            <p className="py-8 text-center text-xs font-semibold text-slate-400">No account details added yet.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <UploadCloud size={18} className="text-blue-500" /> Employee Document Upload
            </h3>
            <p className="mt-1 text-xs text-slate-500">Upload PDF, JPG, or PNG files. Maximum size is 10 MB per document.</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            Employee folder: <span className="font-mono">{user.employee_code || "Not assigned"}</span>
          </div>
        </div>

        <form onSubmit={handleDocumentUpload}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {DOCUMENT_UPLOADS.map(({ name, label }) => {
              const status = documentStatuses[name];
              const selectedFile = documentFiles[name];
              return (
                <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${status?.uploaded ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {status?.uploaded ? <FileCheck2 size={18} /> : <FileUp size={18} />}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${status?.uploaded ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {documentsLoading ? "Checking" : status?.uploaded ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  <label htmlFor={`employee-document-${name}`} className="block text-xs font-bold text-slate-700">{label}</label>
                  <input
                    id={`employee-document-${name}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => handleDocumentChange(event, name)}
                    className="mt-3 block w-full text-[11px] text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-2 truncate text-[10px] text-slate-400" title={selectedFile?.name || status?.originalName || status?.fileName || ""}>
                    {selectedFile?.name || status?.originalName || status?.fileName || "No file selected"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => handleSelectedDocumentView(selectedFile, label)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800"
                    >
                      <Eye size={13} /> Preview selected
                    </button>
                  )}
                  {status?.uploaded && (
                    <button
                      type="button"
                      onClick={() => handleDocumentView(name, label)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={13} /> View stored file
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-xs font-semibold ${documentMessage === "Documents uploaded successfully." ? "text-emerald-600" : "text-red-500"}`} role="status">
              {documentMessage}
            </p>
            <button
              type="submit"
              disabled={documentsUploading || !user.employee_code}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E88E5] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1565C0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {documentsUploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              {documentsUploading ? "Uploading..." : "Upload selected documents"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
