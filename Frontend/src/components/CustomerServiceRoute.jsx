import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CustomerServiceRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "CUSTOMER_SERVICE_OFFICER") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default CustomerServiceRoute;
