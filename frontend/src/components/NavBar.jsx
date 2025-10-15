import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import { Stethoscope, LogOut, Settings, User } from 'lucide-react';
import axios from 'axios';

export default function NavBar() {
  const navigate = useNavigate();
  const { userData, getUserData, backendUrl } = useContext(AppContent);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.warn('Logout failed or already logged out:', err.message);
    } finally {
      await getUserData();
      window.location.href = '/login';
    }
  };

  return (
  <nav className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-lg z-10 relative">
      <div className="flex items-center gap-2">
  <Stethoscope className="text-cyan-400" />
  <span className="font-bold text-lg text-white">MedScribe Agent</span>
      </div>
      <div className="flex items-center gap-6">
  <button onClick={() => navigate('/')} className="text-sm text-neutral-200 hover:text-cyan-300 transition">Home</button>
  <button onClick={() => navigate('/dev')} className="text-sm text-neutral-200 hover:text-cyan-300 transition">Analysis</button>
  <button onClick={() => navigate('/features')} className="text-sm text-neutral-200 hover:text-cyan-300 transition">Features</button>
  <button onClick={() => navigate('/pricing')} className="text-sm text-neutral-200 hover:text-cyan-300 transition">Pricing</button>
  <button onClick={() => navigate('/chat')} className="text-sm text-neutral-200 hover:text-cyan-300 transition">Chat</button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold hover:shadow-lg hover:scale-105 transition"
          >
            <img
              src={userData?.avatar || 'https://i.pravatar.cc/40'}
              alt="avatar"
              className="h-9 w-9 rounded-full border border-white/20"
            />
            <span className="hidden sm:inline">{userData?.name || 'Profile'}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-lg shadow-lg z-20 animate-fadeIn text-neutral-200">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 transition"
              >
                <User className="h-4 w-4 text-cyan-400" /> <span className="text-neutral-200">Profile</span>
              </button>
              <button
                onClick={() => alert('⚙️ Settings page coming soon!')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 transition"
              >
                <Settings className="h-4 w-4 text-emerald-400" /> <span className="text-neutral-200">Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-800 text-red-400 transition"
              >
                <LogOut className="h-4 w-4 text-red-400" /> <span className="text-red-400">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
