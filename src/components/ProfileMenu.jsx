import { useEffect, useRef, useState } from "react";
import { Edit, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axios";
import useAuth from "../hooks/useAuth";

export default function ProfileMenu({ profilePath = "/profile" }) {
  const [open, setOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const menuRef = useRef(null);
  const pictureUrlRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [open]);

  useEffect(() => {
    let active = true;
    if (!user?.id) return undefined;

    axiosInstance.get("/auth/profile/picture", { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(response.data);
        if (pictureUrlRef.current) URL.revokeObjectURL(pictureUrlRef.current);
        pictureUrlRef.current = objectUrl;
        setProfilePictureUrl(objectUrl);
      })
      .catch((error) => {
        if (!active || error.response?.status === 404) return;
        console.error("Failed to fetch profile picture:", error);
      });

    return () => {
      active = false;
      if (pictureUrlRef.current) {
        URL.revokeObjectURL(pictureUrlRef.current);
        pictureUrlRef.current = null;
      }
    };
  }, [user?.id, user?.profile_picture_version]);

  const openProfile = () => {
    setOpen(false);
    navigate(profilePath);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-blue-400 bg-[#1E88E5] text-sm font-bold text-white transition-transform hover:scale-105"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt={`${user?.name || "User"} profile`}
            className="h-full w-full object-cover"
            onError={() => setProfilePictureUrl("")}
          />
        ) : (
          user?.name?.charAt(0)?.toUpperCase() || "U"
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-60 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-2 border-b border-gray-100 px-2 py-2">
            <h4 className="truncate text-sm font-bold text-gray-800">{user?.name || "User"}</h4>
            <p className="mt-0.5 text-xs font-semibold text-gray-500">{user?.employee_code || user?.department}</p>
          </div>
          <button type="button" onClick={openProfile} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-bold text-blue-600 transition hover:bg-blue-50">
            <Edit size={16} /> Profile
          </button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50">
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
