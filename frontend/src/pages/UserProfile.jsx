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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function UserProfile() {
  const { backendUrl, userData } = useContext(AppContent);
  const backend_AI = "http://localhost:8001";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState([]);
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

  // Fetch latest insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data } = await axios.get(
          `${backend_AI}/insights/profile/${userData?.userId}`
        );
        setInsights(data);
      } catch (err) {
        console.warn("⚠️ No health insights yet for this user.");
      }
    };
    if (userData?.userId) fetchInsights();
  }, [backend_AI, userData]);

  // Fetch trend history
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const { data } = await axios.get(
          `${backend_AI}/insights/trends/${userData?.userId}`
        );
        if (data.trends) setTrends(data.trends);
      } catch (err) {
        console.warn("⚠️ No trend data yet.");
      }
    };
    if (userData?.userId) fetchTrends();
  }, [backend_AI, userData]);

  // Handle profile update
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
      alert("⚠️ Failed to update profile");
    }
  };

  if (loading) return <div className="text-center p-6">Loading profile...</div>;
  if (!profile) return <div className="text-center p-6">⚠️ Profile not found</div>;

  const latest = insights?.data?.insights || {};
  const summary = insights?.data?.summary;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-10 px-4 space-y-10">
      {/* Profile Header */}
      <div className="max-w-4xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-6">
          <img
            src={userData?.avatar || "https://i.pravatar.cc/150?img=20"}
            alt="avatar"
            className="h-24 w-24 rounded-full border-2 border-cyan-400"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.fullName || profile.name}
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
      </div>

      {/* Insights Dashboard */}
      <div className="max-w-4xl w-full bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Activity className="text-cyan-400" /> Health Progress Dashboard
        </h2>

        {!latest || Object.keys(latest).length === 0 ? (
          <p className="text-neutral-400">
            No insights available yet. Upload a new report to generate progress.
          </p>
        ) : (
          <>
            <p className="text-neutral-200 mb-6">{summary}</p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="FBS" value={latest.fbs} unit="mg/dL" />
              <MetricCard label="LDL" value={latest.ldl} unit="mg/dL" />
              <MetricCard label="HDL" value={latest.hdl} unit="mg/dL" />
              <MetricCard label="Haemoglobin" value={latest.haemoglobin} unit="g/dL" />
            </div>

            {/* Trends Chart */}
            {trends.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">
                  Historical Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="timestamp" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", color: "#fff" }} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="fbs"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ldl"
                      stroke="#f472b6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="hdl"
                      stroke="#4ade80"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-6 text-sm text-neutral-400">
              Last updated:{" "}
              {new Date(insights?.data?.timestamp || Date.now()).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Reusable Info Card */
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

/* Metric Card */
function MetricCard({ label, value, unit }) {
  const good = label === "LDL" ? value < 130 : label === "HDL" ? value >= 40 : true;
  const trendIcon = good ? (
    <TrendingUp className="text-green-400" size={18} />
  ) : (
    <TrendingDown className="text-red-400" size={18} />
  );

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/10 text-center hover:bg-white/20 transition">
      <h3 className="text-cyan-400 font-semibold mb-1">{label}</h3>
      <p className="text-2xl font-bold text-white">
        {value != null ? value : "—"}{" "}
        <span className="text-sm text-neutral-400">{unit}</span>
      </p>
      <div className="flex justify-center items-center mt-1">{trendIcon}</div>
    </div>
  );
}
