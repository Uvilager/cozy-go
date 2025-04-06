import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that require authentication
const protectedPaths = ["/tasks", "/settings"]; // Add other protected paths as needed

// Define paths that should only be accessible to unauthenticated users
const publicOnlyPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  // 1. Get token from cookies
  const token = request.cookies.get("authToken")?.value; // Adjust cookie name if different

  const { pathname } = request.nextUrl;

  // 2. Redirect unauthenticated users from protected paths
  if (protectedPaths.some((path) => pathname.startsWith(path)) && !token) {
    console.log(
      `Middleware: No token found for protected path ${pathname}. Redirecting to login.`
    );
    // Redirect to login, preserving the intended destination as a query param
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Redirect authenticated users from public-only paths
  if (publicOnlyPaths.some((path) => pathname.startsWith(path)) && token) {
    console.log(
      `Middleware: Token found for public-only path ${pathname}. Redirecting to tasks.`
    );
    // Redirect to a default page for authenticated users
    return NextResponse.redirect(new URL("/tasks", request.url));
  }

  // 4. Allow request to proceed
  console.log(
    `Middleware: Allowing request for ${pathname}. Token present: ${!!token}`
  );
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
