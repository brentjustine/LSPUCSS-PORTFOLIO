import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: ReactNode;
  session: Session | null;
}

export default function ProtectedRoute({ children, session }: ProtectedRouteProps) {
  const location = useLocation();

  const authPages = ["/login", "/register"];
  const resetPasswordPage = "/reset-password";

  // If logged in and trying to access login/register → redirect
  if (session && authPages.includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If NOT logged in and trying to access protected pages → redirect to login
  if (!session && !authPages.includes(location.pathname) && location.pathname !== resetPasswordPage) {
    return <Navigate to="/login" replace />;
  }

  // If on reset-password but no token from email → redirect to login
  if (
    location.pathname === resetPasswordPage &&
    !location.search.includes("access_token")
  ) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
