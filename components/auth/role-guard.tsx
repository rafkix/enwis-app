"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@/stores/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles = ["teacher", "admin"],
  fallback = null,
  redirectTo = "/"
}: RoleGuardProps) {
  const { isAuthenticated, isLoading, role, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchMe();
    }
  }, [fetchMe, isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--color-deep)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return fallback || null;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return fallback || null;

  return <>{children}</>;
}

export function StudentGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["user", "teacher", "admin"]}>{children}</RoleGuard>;
}

export function TeacherGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["teacher", "admin"]}>{children}</RoleGuard>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}