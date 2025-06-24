"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, LogOut, User } from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { RegisterDialog } from "@/components/auth/register-dialog";
import { logoutAction } from "./auth-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AuthSectionProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  isLoggedIn: boolean;
}

export function AuthSection({ user, isLoggedIn }: AuthSectionProps) {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const handleAuthSuccess = () => {
    // Refresh the page to update the auth state
    router.refresh();
  };

  const handleLogout = async () => {
    await logoutAction();
  };

  if (isLoggedIn && user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/user" className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4" />
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLoginOpen(true)}
          className="flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => setRegisterOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Sign Up
        </Button>
      </div>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleAuthSuccess}
      />

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
