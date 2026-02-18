"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold">George's Tasks</h1>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
          Sign out
        </Button>
      </div>
    </nav>
  );
}
