import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

import Navbar from "./components/Navbar";
import DeveloperLogo from "./components/DeveloperSign";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import SuspendedPage from "./pages/SuspendedPage";
import GoodbyePage from "./pages/GoodbyePage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket, setAuthUser } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const forceLogout = (message, redirect = "/login") => {
    setAuthUser(null);
    toast.error(message);
    navigate(redirect);
  };

  // On mount, check if user is logged in
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  // On load, if suspended, redirect
  useEffect(() => {
    if (authUser?.isSuspended && window.location.pathname !== "/suspended") {
      navigate("/suspended");
    }
  }, [authUser, navigate]);

  // Socket event listener: suspend, block, delete
  useEffect(() => {
    if (!socket || !authUser?._id) return;

    socket.emit("register-user", authUser._id);

    socket.on("user-action", ({ type, reason, until }) => {
      switch (type) {
        case "suspended":
          forceLogout(`⛔ Suspended until ${new Date(until).toLocaleString()}. Reason: ${reason}`, "/suspended");
          break;
        case "unsuspended":
          toast.success("✅ Suspension lifted. Please log in again.");
          navigate("/login");
          break;
        case "blocked":
          forceLogout("🚫 You have been blocked by admin.", "/blocked");
          break;
        case "unblocked":
          toast.success("✅ You’ve been unblocked. Please log in again.");
          navigate("/login");
          break;
        case "deleted":
          forceLogout("❌ Your account has been deleted.", "/goodbye");
          break;
        default:
          break;
      }
    });

    return () => {
      socket.off("user-action");
    };
  }, [socket, authUser, navigate, setAuthUser]);

  // Show loader until auth check is done
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={authUser?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/suspended" element={<SuspendedPage />} />
        <Route path="/goodbye" element={<GoodbyePage />} />
        <Route path="/blocked" element={<GoodbyePage />} />
      </Routes>
      <Toaster />
      <DeveloperLogo />
    </div>
  );
};

export default App;