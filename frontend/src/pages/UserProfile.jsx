// frontend/src/pages/UserProfile.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { ShieldCheck, User, Mail, Phone, MapPin, Calendar, BadgeCheck } from "lucide-react";

export default function UserProfile() {
  const { backendUrl, userData } = useContext(AppContent);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Handle updates
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
      <div className="max-w-3xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
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

        {/* Editable Fields */}
        {editing && (
          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              defaultValue={profile.name}
              onChange={(e) => setUpdates({ ...updates, name: e.target.value })}
              className="w-full p-2 rounded bg-white/10"
            />
            <input
              type="email"
              placeholder="Email"
              defaultValue={profile.email}
              onChange={(e) => setUpdates({ ...updates, email: e.target.value })}
              className="w-full p-2 rounded bg-white/10"
            />
            <input
              type="text"
              placeholder="Role"
              defaultValue={profile.role}
              onChange={(e) => setUpdates({ ...updates, role: e.target.value })}
              className="w-full p-2 rounded bg-white/10"
            />
            <input
              type="text"
              placeholder="Status"
              defaultValue={profile.status}
              onChange={(e) => setUpdates({ ...updates, status: e.target.value })}
              className="w-full p-2 rounded bg-white/10"
            />
          </div>
        )}

        {/* Action Buttons */}
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
    </div>
  );
}

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
