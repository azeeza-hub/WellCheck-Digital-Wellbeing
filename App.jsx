import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import RecoveryPlan from "./pages/RecoveryPlan";
import PeerWall from "./pages/PeerWall";
import Counsellor from "./pages/Counsellor";
import BookCounsellor from "./pages/BookCounsellor";

export default function App() {
  const [page, setPage] = useState("login");
  const [mascot, setMascot] = useState("roxy");
  const [userRole, setUserRole] = useState("student");

  const handleLogout = () => {
    localStorage.removeItem("wc_token");
    localStorage.removeItem("wc_user");
    setPage("login");
    setMascot("roxy");
    setUserRole("student");
  };

  const handleNavigate = (destination) => {
    if (destination === "Logout") { handleLogout(); return; }
    const map = {
      "Dashboard": "dashboard", "Assessment": "assessment",
      "My Results": "results", "Recovery Plan": "plan",
      "Peer Wall": "peer", "Book Counsellor": "book",
    };
    if (map[destination]) setPage(map[destination]);
  };

  if (page === "dashboard") return <Dashboard mascot={mascot} onNavigate={handleNavigate} />;
  if (page === "assessment") return <Assessment mascot={mascot} onNavigate={handleNavigate} onFinish={() => setPage("results")} />;
  if (page === "results") return <Results mascot={mascot} onNavigate={handleNavigate} />;
  if (page === "plan") return <RecoveryPlan mascot={mascot} onNavigate={handleNavigate} />;
  if (page === "peer") return <PeerWall mascot={mascot} onNavigate={handleNavigate} />;
  if (page === "book") return <BookCounsellor mascot={mascot} onNavigate={handleNavigate} />;
  if (page === "counsellor") return <Counsellor mascot={mascot} onNavigate={handleNavigate} />;

  return (
    <div>
      {page === "login" && (
        <Login
          onSwitch={() => setPage("register")}
          onLogin={(role) => {
            setUserRole(role);
            setPage(role === "counsellor" ? "counsellor" : "dashboard");
          }}
        />
      )}
      {page === "register" && (
        <Register
          onSwitch={() => setPage("login")}
          onLogin={(role, userData) => {
            setUserRole(role);
            if (userData?.mascot) setMascot(userData.mascot);
            setPage(role === "counsellor" ? "counsellor" : "dashboard");
          }}
        />
      )}
    </div>
  );
}