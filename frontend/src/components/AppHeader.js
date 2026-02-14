import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppHeader.css";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : "?";

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-header-profile-wrap" ref={menuRef}>
          <button
            type="button"
            className="app-header-avatar"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="true"
          >
            {initial}
          </button>
          {open && (
            <div className="app-header-dropdown">
              <div className="app-header-dropdown-user">
                <span className="app-header-dropdown-name">{user?.name || "User"}</span>
                {user?.email && <span className="app-header-dropdown-email">{user.email}</span>}
              </div>
              <button type="button" className="app-header-dropdown-item" onClick={() => { setOpen(false); navigate("/"); }}>
                Home
              </button>
              <button type="button" className="app-header-dropdown-item" onClick={() => { setOpen(false); navigate("/dashboard"); }}>
                Dashboard
              </button>
              <button type="button" className="app-header-dropdown-item" onClick={() => { setOpen(false); navigate("/settings/api-key"); }}>
                API key
              </button>
              <button type="button" className="app-header-dropdown-item app-header-dropdown-item--danger" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
        <span className="app-header-title">AI Exam Assistant</span>
      </div>
    </header>
  );
}
