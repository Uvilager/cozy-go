"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  // Remove min-h-svh, add h-full to take available space from flex-grow parent
  return (
    <div className="flex h-full w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
