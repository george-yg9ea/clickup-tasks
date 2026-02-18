"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">George's Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Sign in with your @whiterabbit.group email
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
