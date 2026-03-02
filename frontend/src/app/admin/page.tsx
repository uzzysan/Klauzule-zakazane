"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { LoginForm } from "@/components/admin/login-form";
import { AdminDashboard } from "@/components/admin/dashboard";

export default function AdminPage() {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Ładowanie...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Sprawdzanie autoryzacji...</div>
      </div>
    );
  }

  // Not authenticated - show login form
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <LoginForm />
      </div>
    );
  }

  // Check if user has admin/reviewer privileges
  if (!user.is_admin && !user.is_reviewer) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Brak uprawnień</h2>
          <p className="text-sm text-muted-foreground">
            Nie masz uprawnień do panelu administracyjnego. Skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated with proper privileges - show dashboard
  return <AdminDashboard user={user} />;
}
