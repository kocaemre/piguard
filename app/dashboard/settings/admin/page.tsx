"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Save, UserCheck, Trash2, UserPlus, UserMinus, AlertCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

interface ApprovedUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isRevokingAccess, setIsRevokingAccess] = useState<string | null>(null);
  const [newUserCreated, setNewUserCreated] = useState(false);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState<string | null>(null);
  const [approvedUser, setApprovedUser] = useState<any | null>(null);

  // Function to fetch admin users
  const fetchAdminUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/admin");
      
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data);
        setError(null);
      } else {
        // Authorization error or server error
        const errorData = await response.json();
        setError(errorData.error || "Failed to retrieve admin list.");
      }
    } catch (err) {
      console.error("Admin users fetch error:", err);
      setError("An error occurred while loading admin users.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch pending users
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/users/pending");
      
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      }
    } catch (err) {
      console.error("Pending users fetch error:", err);
    }
  };

  // Function to fetch approved users
  const fetchApprovedUsers = async () => {
    try {
      const response = await fetch("/api/users/approved");
      
      if (response.ok) {
        const data = await response.json();
        setApprovedUsers(data);
      }
    } catch (err) {
      console.error("Approved users fetch error:", err);
    }
  };

  // Load existing users
  useEffect(() => {
    if (session?.user) {
      fetchAdminUsers();
      fetchPendingUsers();
      fetchApprovedUsers();
    }
  }, [session]);

  // Add a new admin user
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsAddingAdmin(true);
    setError(null);
    setNewUserCreated(false);
    setResetToken(null);
    setResetUrl(null);
    setNewUserEmail(null);

    try {
      const response = await fetch("/api/users/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: newAdminEmail,
          name: newAdminName || undefined // Only send name if provided
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add admin");
      }

      const data = await response.json();
      
      // Check if a new user was created
      if (data.isNewUser) {
        setNewUserCreated(true);
        setResetToken(data.resetToken || null);
        setResetUrl(data.resetUrl || null);
        setNewUserEmail(data.email || null);
      }
      
      await fetchAdminUsers();
      setNewAdminEmail("");
      setNewAdminName("");
      toast.success(`${data.email} has been added as an admin`);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to add admin");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Remove admin role from a user
  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/admin?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove admin");
      }

      await fetchAdminUsers();
      toast.success("Admin role removed successfully");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to remove admin");
    } finally {
      setLoading(false);
    }
  };

  // Approve a pending user
  const handleApproveUser = async (userId: string) => {
    setIsApproving(userId);
    setApprovedUser(null);
    
    try {
      const response = await fetch("/api/users/pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve user");
      }

      const data = await response.json();
      
      // Update the pending users list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Save the approved user data with reset token
      setApprovedUser(data);
      
      // Refresh the approved users list
      await fetchApprovedUsers();
      
      toast.success("User approved successfully");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to approve user");
    } finally {
      setIsApproving(null);
    }
  };

  // Revoke access from an approved user
  const handleRevokeAccess = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke access for this user? They will need to be approved again to regain access.")) {
      return;
    }

    setIsRevokingAccess(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/approved?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to revoke user access");
      }

      // Update the approved users list by removing the user
      setApprovedUsers(approvedUsers.filter(user => user.id !== userId));
      
      // Refresh the pending users list in case the user appears there now
      await fetchPendingUsers();
      
      toast.success("User access revoked successfully");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message || "Failed to revoke user access");
    } finally {
      setIsRevokingAccess(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <div>
              <p className="font-medium text-red-700">Error</p>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-sm text-red-600 mt-1">
                You need to have administrator privileges to view this page.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>
            Promote a user to administrator or create a new admin user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional for new users)</Label>
              <Input
                id="name"
                type="text"
                placeholder="User's name (optional)"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                If the user doesn't exist, they will be created with this name
              </p>
            </div>

            <Button type="submit" disabled={isAddingAdmin}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isAddingAdmin ? "Adding..." : "Add Admin"}
            </Button>
          </form>

          {newUserCreated && (
            <Alert className="mt-4" variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>New User Created</AlertTitle>
              <AlertDescription>
                A new user has been created and assigned admin rights. 
                {resetToken ? (
                  <div className="mt-2 space-y-2">
                    <p>Please share this password reset link with the user:</p>
                    <div className="p-2 bg-muted rounded text-xs break-all">
                      <span className="font-medium">Link:</span> {window.location.origin}{resetUrl}
                    </div>
                    <p className="text-sm">
                      The user will need to use this link to set their password before they can login. 
                      This link is valid for 24 hours.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${resetUrl}`);
                        toast.success("Password reset link copied to clipboard");
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                ) : (
                  <p>The user will need to use the "Forgot Password" feature to set their password on first login.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
          <CardDescription>
            Manage existing administrator accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-4">No admin users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAdmin(user.id)}
                        disabled={adminUsers.length <= 1}
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Admin
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {adminUsers.length <= 1 && (
            <p className="text-sm text-muted-foreground mt-4">
              You cannot remove the last admin user from the system.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Approved Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Users</CardTitle>
          <CardDescription>
            Manage users with system access - revoke access if needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : approvedUsers.length === 0 ? (
            <div className="text-center py-4">No approved users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Approved Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeAccess(user.id)}
                        disabled={isRevokingAccess === user.id}
                        className="bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border-amber-200"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        {isRevokingAccess === user.id ? "Revoking..." : "Revoke Access"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Users</CardTitle>
          <CardDescription>
            Approve new users to allow them to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : pendingUsers.length === 0 && !approvedUser ? (
            <div className="text-center py-4">No pending users found</div>
          ) : (
            <>
              {pendingUsers.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            disabled={isApproving === user.id}
                            className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                          >
                            {isApproving === user.id ? "Approving..." : "Approve User"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Show password reset link after user approval */}
              {approvedUser && (
                <Alert className="mt-4" variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>User Approved Successfully</AlertTitle>
                  <AlertDescription>
                    <p><strong>{approvedUser.name || approvedUser.email}</strong> has been approved and can now access the system.</p>
                    
                    {approvedUser.resetToken && (
                      <div className="mt-2 space-y-2">
                        <p>Please share this password reset link with the user:</p>
                        <div className="p-2 bg-muted rounded text-xs break-all">
                          <span className="font-medium">Link:</span> {window.location.origin}{approvedUser.resetUrl}
                        </div>
                        <p className="text-sm">
                          The user will need to use this link to set their password before they can login. 
                          This link is valid for 24 hours.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}${approvedUser.resetUrl}`);
                              toast.success("Password reset link copied to clipboard");
                            }}
                          >
                            Copy Link
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setApprovedUser(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 