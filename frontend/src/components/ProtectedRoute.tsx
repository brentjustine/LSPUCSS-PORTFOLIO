import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';

export default function ProtectedRoute({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
