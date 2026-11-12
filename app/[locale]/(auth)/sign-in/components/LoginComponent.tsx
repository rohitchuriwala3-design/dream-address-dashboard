"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        toast.error(error.message || "Email or password is incorrect.");
        return;
      }
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
      const destination = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
      window.location.assign(new URL(destination, window.location.origin).href);
    } catch {
      toast.error("Sign in failed. Check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="my-5 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign in to MARK IV</CardTitle>
        <CardDescription>Open your MARK IV workspace, including Nexus 360 CRM and Finance.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={login} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !email || !password}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
          Need a password reset? Contact your MARK IV administrator.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
