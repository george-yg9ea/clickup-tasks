"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar({ initialName }: { initialName?: string | null }) {
  const title = initialName ? `${initialName}'s Tasks` : "My Tasks";

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
