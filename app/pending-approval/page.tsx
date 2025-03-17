"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, MailCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is currently waiting for administrator approval
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-md flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-700" />
            <div>
              <p className="font-medium">What happens next?</p>
              <p className="text-sm mt-1">
                An administrator will review your account request and approve it shortly. 
                You'll be able to access the system once your account has been approved.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md flex gap-3">
            <MailCheck className="h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="font-medium text-gray-700">Check your email</p>
              <p className="text-sm mt-1 text-gray-600">
                You'll receive an email notification when your account is approved.
                Please make sure to check your spam folder.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
            Sign Out
          </Button>
          <p className="text-sm text-center text-gray-500 mt-2">
            If you have any questions, please contact the administrator at{" "}
            <Link href="mailto:admin@piguard.com" className="text-blue-600 hover:underline">
              admin@piguard.com
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 