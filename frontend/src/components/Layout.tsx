import React from "react";
// Link and ModeToggle are used within Navbar now, no longer needed here directly
// import Link from "next/link";
// import { ModeToggle } from "./mode-toggle";
// Import the new Navbar using path alias
import { Navbar } from "./navbar/navbar";
// Import the new Footer
import { Footer } from "./footer/footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Use the new Navbar component */}
      <Navbar />
      {/* <header className="bg-gray-800 text-white p-4">
        <nav className="container mx-auto flex justify-between">
          <Link href="/" className="text-xl font-bold">
            Cozy Cloud Tasks
          </Link>
          <div className="space-x-4">
            <Link href="/" className="hover:text-gray-300">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link href="/register" className="hover:text-gray-300">
              Register
            </Link>
            <ModeToggle />
          </div>
        </nav>
      </header> */}
      <main className="flex-grow container mx-auto p-4">{children}</main>
      {/* Use the new Footer component */}
      <Footer />
    </div>
  );
};

export default Layout;
