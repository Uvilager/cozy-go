import { HomePageContent } from "@/components/home/home-page-content";

// This page component now simply renders the extracted content component.
// It can remain a Server Component if HomePageContent is marked "use client"
// or if HomePageContent itself doesn't require client-side hooks/interactivity.
export default function HomePage() {
  return <HomePageContent />;
}
