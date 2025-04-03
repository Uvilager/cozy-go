import { tasks } from "@/components/tasks/data/tasks";
import { columns } from "@/components/tasks/columns";
import { DataTable } from "@/components/tasks/data-table";

export default function DashboardPage() {
  // In a real app, you would fetch data from your backend API here.
  // For now, we're using the static tasks data.
  const data = tasks;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Task Management</h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
