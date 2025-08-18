import { createContext, useState, useEffect } from "react"; // ✅ added useEffect
import axios from "axios";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);

  // ✅ Function to get logged-in user data
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`http://localhost:4000/api/user/data`, {
        withCredentials: true,
      });

      if (data.success) {
        setUserData(data.userData);
        setIsLoggedin(true); // ✅ Update login state
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

  // ✅ useEffect to call getUserData when app loads
  useEffect(() => {
    getUserData();
  }, []);

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    userData,
    setUserData,
    getUserData,
  };

  return (
    <AppContent.Provider value={value}>
      {props.children}
    </AppContent.Provider>
  );
};