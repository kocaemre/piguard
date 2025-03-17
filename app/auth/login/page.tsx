"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        if (response.error.includes("Your account is not approved yet")) {
          setError("Your account has not been approved yet. Please wait for administrator approval.");
        } else {
          setError("Invalid email or password");
        }
        setLoading(false);
        return;
      }

      // Redirect to dashboard on successful login
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Pi Guard</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Robot Management System</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 p-3 rounded text-red-500 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-between">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <div className="flex flex-col space-y-2">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Forgot Password
              </Link>
              <Link href="/auth/register" className="text-primary hover:underline">
                Register
              </Link>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md text-blue-700 text-sm">
            <p className="font-medium">Information:</p>
            <p>New users can log in after their accounts have been approved by an administrator.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 