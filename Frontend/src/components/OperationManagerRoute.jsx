import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OperationManagerRoute = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "OPERATION_MANAGER") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default OperationManagerRoute;
