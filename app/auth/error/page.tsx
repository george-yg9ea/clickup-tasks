"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const isAccessDenied = error === "AccessDenied";

  return (
    <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 text-center">
      <h1 className="text-xl font-semibold">
        {isAccessDenied ? "Access denied" : "Something went wrong"}
      </h1>
      <p className="text-muted-foreground text-sm">
        {isAccessDenied
          ? "Only @whiterabbit.group email addresses can sign in."
          : "An error occurred during sign in. Please try again."}
      </p>
      <Button asChild className="w-full">
        <Link href="/auth/signin">Back to sign in</Link>
      </Button>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense fallback={<div className="w-full max-w-sm rounded-lg border p-8" />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
