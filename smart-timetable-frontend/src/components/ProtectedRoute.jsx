import { Navigate } from "react-router-dom";

const getRoleFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

const ProtectedRoute = ({ children, allowedRoles }) => {

    const token = localStorage.getItem("token");
    const role = getRoleFromToken();

    // Not logged in
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Role not allowed
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;