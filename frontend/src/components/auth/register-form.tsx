import { cn } from "@/lib/utils";
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
import React, { useState } from "react"; // Keep useState for form fields
// No longer need useRouter here, handled by the hook
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth"; // Import the register hook
import { toast } from "sonner"; // Import toast for password mismatch error

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [error, setError] = useState(""); // Handled by hook/toast
  // const [loading, setLoading] = useState(false); // Handled by hook isPending
  const [username, setUsername] = useState("");
  // const router = useRouter(); // Handled by hook

  // Use the register mutation hook
  const { mutate: registerMutate, isPending } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match"); // Use toast for this error
      return;
    }

    // Call the mutation function from the hook
    // Ensure payload matches RegisterPayload (Username, Email, Password)
    registerMutate({ Username: username, Email: email, Password: password });
    // The hook's onSuccess/onError handles toast notifications and redirect
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your info below to register your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Error display is now handled by toast notifications */}
              {/* {error && (
                <p className="text-red-500 text-xs italic mt-2">{error}</p>
              )} */}
              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="JohnDoe"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isPending} // Use isPending from hook
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending} // Use isPending from hook
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending} // Use isPending from hook
                  placeholder="••••••••"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending} // Use isPending from hook
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
