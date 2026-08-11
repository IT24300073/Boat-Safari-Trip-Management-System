import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";  // ✅ IMPORT IT
import Home from "./Pages/Home";
import AdminPanel from "./Pages/AdminPanel";
import Booking from "./Pages/Booking";
import Login from "./Pages/Login";
import Registration from "./Pages/Registration";
import Feedback from "./Pages/Feedback";
import Booktrip from "./Pages/Booktrip";
import Report from "./Pages/Report";
import Invoice from "./Pages/Invoice";
import UserManagement from "./Pages/UserManagement";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  return (
    <BrowserRouter>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        {/* ✅ Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/register" element={<Registration />} />

        {/* 🔒 Private (Protected) Routes */}
        <Route
          path="/booking"
          element={
            <PrivateRoute>
              <Booking />
            </PrivateRoute>
          }
        />
        <Route
          path="/booktrip"
          element={
            <PrivateRoute>
              <Booktrip />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <PrivateRoute>
              <Feedback />
            </PrivateRoute>
          }
        />
        <Route
          path="/report"
          element={
            <PrivateRoute>
              <Report />
            </PrivateRoute>
          }
        />
        <Route
          path="/invoice/:id"
          element={
            <PrivateRoute>
              <Invoice />
            </PrivateRoute>
          }
        />
        <Route
          path="/usermanagement"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
