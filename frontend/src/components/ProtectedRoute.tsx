import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: ReactNode;
  session: Session | null;
}

export default function ProtectedRoute({ children, session }: ProtectedRouteProps) {
  const location = useLocation();

  // Pages that should only be accessible when logged OUT
  const guestOnlyPages = ["/login", "/register"];

  // Pages that require a token in the URL
  const tokenProtectedPages = ["/update-password"];

  // 1️⃣ Redirect logged-in users away from guest-only pages
  if (session && guestOnlyPages.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // 2️⃣ Redirect logged-in users away from token-protected pages
  if (session && tokenProtectedPages.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  // 3️⃣ Redirect logged-out users trying to access normal protected pages
  if (
    !session &&
    !guestOnlyPages.includes(location.pathname) &&
    !tokenProtectedPages.includes(location.pathname)
  ) {
    return <Navigate to="/login" replace />;
  }

  // 4️⃣ Check token for token-protected pages
  if (tokenProtectedPages.includes(location.pathname) && !location.search.includes("access_token")) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
