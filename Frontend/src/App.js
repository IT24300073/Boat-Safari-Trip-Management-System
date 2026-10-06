import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import OperationManagerRoute from "./components/OperationManagerRoute";
import MarketingRoute from "./components/MarketingRoute";
import CustomerServiceRoute from "./components/CustomerServiceRoute";
import FinanceExecutiveRoute from "./components/FinanceExecutiveRoute";
import Home from "./Pages/Home";
import AdminPanel from "./Pages/AdminPanel";
import OperationsDashboard from "./Pages/OperationsDashboard";
import OperationsFeedback from "./Pages/OperationsFeedback";
import OperationsGroupBookings from "./Pages/OperationsGroupBookings";
import MarketingDashboard from "./Pages/MarketingDashboard";
import CSORegistration from "./Pages/CSORegistration";
import Booking from "./Pages/Booking";
import Login from "./Pages/Login";
import Registration from "./Pages/Registration";
import ResetPassword from "./Pages/ResetPassword";
import Feedback from "./Pages/Feedback";
import Booktrip from "./Pages/Booktrip";
import Report from "./Pages/Report";
import Invoice from "./Pages/Invoice";
import FinanceExecutivePanel from "./Pages/FinanceExecutivePanel";
import UserManagement from "./Pages/UserManagement";
import MaintenanceReport from "./Pages/MaintenanceReport";
import SafariScheduleManager from "./Pages/SafariScheduleManager";
import MyBookings from "./Pages/MyBookings";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* ✅ Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
            path="/maintenance"
            element={
              <PrivateRoute>
                <MaintenanceReport />
              </PrivateRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <OperationManagerRoute>
                <SafariScheduleManager />
              </OperationManagerRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/operations-dashboard"
            element={
              <OperationManagerRoute>
                <OperationsDashboard />
              </OperationManagerRoute>
            }
          />
          <Route
            path="/operations-feedback"
            element={
              <OperationManagerRoute>
                <OperationsFeedback />
              </OperationManagerRoute>
            }
          />
          <Route
            path="/operations-group-bookings"
            element={
              <OperationManagerRoute>
                <OperationsGroupBookings />
              </OperationManagerRoute>
            }
          />
          <Route
            path="/marketing-dashboard"
            element={
              <MarketingRoute>
                <MarketingDashboard />
              </MarketingRoute>
            }
          />
          <Route
            path="/cso-register"
            element={
              <CustomerServiceRoute>
                <CSORegistration />
              </CustomerServiceRoute>
            }
          />
          <Route
            path="/finance-executive"
            element={
              <FinanceExecutiveRoute>
                <FinanceExecutivePanel />
              </FinanceExecutiveRoute>
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
              <OperationManagerRoute>
                <Report />
              </OperationManagerRoute>
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
          <Route
            path="/my-bookings"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
