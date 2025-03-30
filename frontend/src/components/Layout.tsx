import React from "react";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
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
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">{children}</main>
      <footer className="bg-gray-200 text-center p-4 mt-auto">
        &copy; {new Date().getFullYear()} Cozy Cloud Tasks
      </footer>
    </div>
  );
};

export default Layout;
