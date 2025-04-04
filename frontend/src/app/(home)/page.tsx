import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@radix-ui/react-icons"; // Or use lucide-react if preferred

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
      {/* Adjust min-h value based on your header/footer height */}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
        Welcome to Cozy Cloud Tasks
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
        A Shadcn UI inspired application for smart task management and seamless
        collaboration.
      </p>
      {/* <div className="flex flex-col items-center space-y-2"> */}
      {/* <p className="text-sm text-muted-foreground">Go to your tasks</p> */}
      <Link href="/tasks" passHref>
        {" "}
        {/* Link to the new tasks page route */}
        <Button size="lg">
          Your Tasks
          <ArrowRightIcon className="ml-1 h-5 w-5" />
        </Button>
      </Link>
      {/* </div> */}
    </div>
  );
}
