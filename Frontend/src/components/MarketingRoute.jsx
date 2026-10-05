import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MarketingRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "MARKETING_COORDINATOR") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default MarketingRoute;
