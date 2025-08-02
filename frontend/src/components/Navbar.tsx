// === src/components/Navbar.tsx ===
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  FaHome,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaUsers,
  FaSearch,
} from "react-icons/fa";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/users?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const NavLinks = () => (
    <>
      <Link to="/" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-90">
        <FaHome /> Home
      </Link>
      <Link to="/users" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-90">
        <FaUsers /> Users
      </Link>
      <Link to="/profile" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-90">
        <FaUserCircle /> Profile
      </Link>
      <button onClick={handleLogout} className="flex items-center gap-2 hover:opacity-90">
        <FaSignOutAlt /> Logout
      </button>
    </>
  );

  const GuestLinks = () => (
    <>
      <Link to="/login" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-90">
        <FaSignInAlt /> Login
      </Link>
      <Link to="/register" onClick={closeMenu} className="flex items-center gap-2 hover:opacity-90">
        <FaUserPlus /> Register
      </Link>
    </>
  );

  return (
    <nav className="bg-blue-600 text-white sticky top-0 z-50 shadow-md">
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl sm:text-2xl font-bold animate-pulse">
            📚 LSPU CCS PORTFOLIO
          </Link>

          {/* Search bar (only when logged in) */}
          {user && (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="px-3 py-1 rounded text-black md:w-64"
              />
              <button type="submit" className="bg-white text-blue-600 px-3 py-1 rounded">
                <FaSearch />
              </button>
            </form>
          )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6 text-sm sm:text-base items-center">
          {user ? <NavLinks /> : <GuestLinks />}
        </div>

        {/* Mobile toggle */}
        <button
          className="text-2xl md:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-4 text-sm sm:text-base animate-slide-down">
          {user && (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="px-3 py-1 rounded text-black w-full"
              />
              <button type="submit" className="bg-white text-blue-600 px-3 py-1 rounded">
                <FaSearch />
              </button>
            </form>
          )}
          {user ? <NavLinks /> : <GuestLinks />}
        </div>
      )}
    </nav>
  );
}
