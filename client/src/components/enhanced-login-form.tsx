import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Mail, Shield, UserPlus, LogIn, AlertCircle, CheckCircle } from "lucide-react";
import { FirestoreAdminService } from "@/lib/firestore-admin";
import { Timestamp } from "firebase/firestore";

interface EnhancedLoginFormProps {
  onSuccess: () => void;
}

export function EnhancedLoginForm({ onSuccess }: EnhancedLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const hasAdmin = await FirestoreAdminService.hasAdminUser();
      setAdminExists(hasAdmin);
      if (!hasAdmin) {
        setActiveTab("signup");
      }
    } catch (error) {
      console.error("Error checking admin existence:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Validate admin with Firestore
      const adminDocument = await FirestoreAdminService.validateAdmin(email);
      
      if (!adminDocument) {
        setError("Admin account not found");
        setIsLoading(false);
        return;
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, adminDocument.hashedPassword);
      
      if (!isPasswordValid) {
        setError("Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Update last login in Firestore
      await FirestoreAdminService.updateLastLogin(adminDocument.id);
      
      // Convert admin document to user data
      const adminUser = {
        id: adminDocument.id,
        email: adminDocument.email,
        username: adminDocument.username,
        role: adminDocument.role,
        createdAt: adminDocument.createdAt.toDate(),
        lastLogin: new Date(),
      };

      // Notify server
      await fetch("/api/firestore/validate-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminData: { ...adminDocument, lastLogin: new Date() } }),
      });
      
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => onSuccess(), 1000);
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Hash password on client side for better security
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      const adminId = `admin_${Date.now()}`;

      // Create admin document for Firestore
      const adminDocument = {
        id: adminId,
        email,
        username,
        role: 'admin' as const,
        hashedPassword,
        createdAt: Timestamp.now(),
      };

      // Store in Firestore
      const adminUser = await FirestoreAdminService.createAdmin(adminDocument);
      
      // Also notify the server
      await fetch("/api/firestore/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminData: adminDocument }),
      });
      
      localStorage.setItem("adminUser", JSON.stringify(adminUser));
      setSuccess("Admin account created successfully! Redirecting...");
      setTimeout(() => onSuccess(), 1000);
    } catch (error: any) {
      setError(error.message || "Failed to create admin account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Secure access to program management
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="space-y-4">
            {adminExists === false && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <UserPlus className="w-4 h-4" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  No admin account exists. Create the first admin account to get started.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="login" 
                  disabled={adminExists === false}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  disabled={adminExists === true}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <CardTitle className="text-xl text-center">Admin Login</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access the admin dashboard
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <CardTitle className="text-xl text-center">Create Admin Account</CardTitle>
                <CardDescription className="text-center">
                  Set up the first admin account for this application
                </CardDescription>
                
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Enter admin username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password should be at least 8 characters long
                    </p>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Create Admin Account
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Secured by Firebase Authentication</p>
        </div>
      </div>
    </div>
  );
}