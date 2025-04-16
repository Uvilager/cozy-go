import React from "react";

export function Footer() {
  return (
    <footer className="text-center p-4 mt-auto border-t border-border/40 text-muted-foreground text-sm sm:text-base">
      &copy; {new Date().getFullYear()} Cozy Cloud Tasks
    </footer>
  );
}
