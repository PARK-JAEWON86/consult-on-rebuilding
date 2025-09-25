"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthPage from "@/components/auth/AuthPage";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <AuthPage defaultTab="login" />;
}