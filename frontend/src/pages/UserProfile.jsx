// frontend/src/pages/UserProfile.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BadgeCheck,
  Activity,
} from "lucide-react";

export default function UserProfile() {
  const { backendUrl, userData } = useContext(AppContent);
  const backend_AI = "http://localhost:8001"; // ✅ FastAPI backend for AI/Insights

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [editing, setEditing] = useState(false);
  const [updates, setUpdates] = useState({});

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/data`, {
          withCredentials: true,
          headers: { "X-User-Id": userData?.userId },
        });
        if (data.success) setProfile(data.userData);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    if (userData?.userId) fetchProfile();
  }, [backendUrl, userData]);

  // Fetch Health Insights from FastAPI backend (MCP-powered)
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data } = await axios.get(
          `${backend_AI}/insights/profile/${userData?.userId}`
        );
        setInsights(data.insights);
      } catch (err) {
        console.warn("⚠️ No health insights yet for this user.");
      }
    };
    if (userData?.userId) fetchInsights();
  }, [backend_AI, userData]);

  // Handle profile updates
  const handleUpdate = async () => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/user/update`, {
        userId: profile.userId,
        updates,
      });
      if (data.success) {
        alert("✅ Profile updated!");
        setProfile({ ...profile, ...updates });
        setEditing(false);
        setUpdates({});
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("⚠️ Failed to update profile");
    }
  };

  if (loading) return <div className="text-center p-6">Loading profile...</div>;
  if (!profile) return <div className="text-center p-6">⚠️ Profile not found</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-10 px-4">
      {/* Profile Card */}
      <div className="max-w-3xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl mb-10">
        <div className="flex items-center gap-6">
          <img
            src={userData?.avatar || "https://i.pravatar.cc/150?img=20"}
            alt="avatar"
            className="h-24 w-24 rounded-full border-2 border-cyan-400"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.name}
              {profile.isVerified && <BadgeCheck className="text-cyan-400" />}
              {profile.isAdmin && <ShieldCheck className="text-red-400" />}
            </h1>
            <p className="text-neutral-300">{profile.role || "Patient"}</p>
            <p className="text-sm text-neutral-400">{profile.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <InfoCard icon={<User />} label="NIC" value={profile.nic} />
          <InfoCard icon={<Calendar />} label="Date of Birth" value={profile.dob} />
          <InfoCard icon={<User />} label="Gender" value={profile.gender} />
          <InfoCard icon={<Phone />} label="Phone" value={profile.phoneNo} />
          <InfoCard icon={<MapPin />} label="Address" value={profile.address} />
          <InfoCard icon={<Mail />} label="Email" value={profile.email} />
        </div>

        {/* Edit buttons */}
        <div className="mt-6 flex gap-4">
          {editing ? (
            <>
              <button
                onClick={handleUpdate}
                className="bg-gradient-to-r from-cyan-400 to-emerald-500 text-black font-semibold px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-white/20 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-fuchsia-400 to-pink-500 text-black font-semibold px-4 py-2 rounded-lg"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Health Insights Section */}
      <div className="max-w-3xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="text-cyan-400" /> Health Insights
        </h2>

        {!insights ? (
          <p className="text-neutral-400">
            No insights available yet. Upload a new report to generate progress.
          </p>
        ) : (
          <>
            <p className="text-neutral-200 mb-6">{insights.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="BMI"
                value={insights.insights.bmi}
                trend={insights.insights.trend?.bmi}
              />
              <MetricCard
                label="Blood Pressure"
                value={`${insights.insights.bp_sys}/${insights.insights.bp_dia}`}
                trend={insights.insights.trend?.bp_sys}
              />
              <MetricCard
                label="HbA1c"
                value={insights.insights.hba1c}
                trend={insights.insights.trend?.hba1c}
              />
              <MetricCard
                label="LDL"
                value={insights.insights.ldl}
                trend={insights.insights.trend?.ldl}
              />
            </div>
            <div className="mt-6 text-sm text-neutral-400">
              Last updated: {new Date(insights.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small reusable components
function InfoCard({ icon, label, value }) {
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <div className="flex items-center gap-2 text-cyan-400 mb-1">
        {icon} <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="text-neutral-200">{value || "N/A"}</p>
    </div>
  );
}

function MetricCard({ label, value, trend }) {
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/10 text-center">
      <h3 className="text-cyan-400 font-semibold mb-1">{label}</h3>
      <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
      {trend && (
        <p className={`text-sm ${trend === "↑" ? "text-red-400" : "text-green-400"}`}>
          {trend === "↑" ? "Increased" : "Improved"}
        </p>
      )}
    </div>
  );
}
