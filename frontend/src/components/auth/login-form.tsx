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
import React, { useState } from "react"; // Keep useState for email/password
// No longer need useRouter here, handled by the hook
import Link from "next/link";
import { useLogin } from "@/hooks/useAuth"; // Import the login hook

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState(""); // Handled by hook/toast
  // const [loading, setLoading] = useState(false); // Handled by hook isPending
  // const router = useRouter(); // Handled by hook

  // Use the login mutation hook
  const { mutate: loginMutate, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Call the mutation function from the hook
    loginMutate({ email, password });
    // The hook's onSuccess/onError handles state update, toast, and redirect
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
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
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Logging in..." : "Login"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                >
                  {/* TODO: Implement Google Login */}
                  Login with Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline underline-offset-4">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
