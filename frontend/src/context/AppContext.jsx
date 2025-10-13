import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [usage, setUsage] = useState(null); // ✅ NEW: usage tracking

  // ✅ Function to get logged-in user data
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        withCredentials: true,
      });

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedin(true);
      } else {
        toast.error(data.message);
        setUserData(null);
        setIsLoggedin(false);
      }
    } catch (error) {
      setUserData(null);
      setIsLoggedin(false);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // ✅ Function to get user usage data
  const getUsage = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/usage/stats`, {
        withCredentials: true,
      });
      if (data.success) {
        setUsage(data.data);
      } else {
        console.warn("⚠️ Usage data not found:", data.message);
      }
    } catch (err) {
      console.error("Usage fetch failed:", err.message);
    }
  };

  // ✅ Load both user & usage data when app starts
  useEffect(() => {
    getUserData();
    getUsage();
  }, []);

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
    usage, // ✅ expose usage data globally
    getUsage, // ✅ expose function to refresh usage
  };

  return (
    <AppContent.Provider value={value}>
      {props.children}
    </AppContent.Provider>
  );
};
