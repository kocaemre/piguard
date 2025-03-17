"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setResetToken(null);

    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      setSuccess(true);
      toast.success("Reset link sent! Check your email.");
      
      // For demo purposes only - in production this would come via email
      if (data.token) {
        setResetToken(data.token);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center mb-2">
          <Link href="/auth/login" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Link>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        </div>
        <CardDescription>
          Enter your email address and we'll send you a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Development Mode Notice */}
        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Development Environment</AlertTitle>
          <AlertDescription className="text-sm">
            In this development environment, no actual emails are sent. The reset token will be displayed below for demo purposes. In a production environment, this token would be sent via email.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || success}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || success || !email}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Link Sent</AlertTitle>
              <AlertDescription>
                A password reset link has been sent to your email address.
                Please check your email.
              </AlertDescription>
            </Alert>
          )}

          {/* Demo only - In production this would come via email */}
          {resetToken && (
            <div className="mt-4 p-4 border border-dashed rounded-md">
              <h3 className="text-sm font-medium mb-2">Demo Version: Password Reset</h3>
              <p className="text-xs text-muted-foreground mb-2">
                This token would normally be sent via email. It's shown here for demo purposes.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-xs font-medium">Token:</span>
                  <code className="text-xs ml-2 p-1 bg-muted rounded">{resetToken}</code>
                </div>
                <Link 
                  href={`/auth/reset-password?token=${resetToken}`}
                  className="text-xs text-primary hover:underline"
                >
                  Go to password reset page
                </Link>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 