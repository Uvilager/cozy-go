import React from "react";

// Mock data - replace with API call later
const mockTasks = [
  { id: 1, title: "Setup project structure", status: "Completed" },
  { id: 2, title: "Create frontend layout", status: "Completed" },
  { id: 3, title: "Implement Login page", status: "In Progress" },
  { id: 4, title: "Implement Registration page", status: "Todo" },
  { id: 5, title: "Build Task Service backend", status: "Todo" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Task Dashboard</h1>

      {/* TODO: Add button/form to create new tasks */}

      <div className="bg-white shadow-md rounded my-6">
        <table className="min-w-max w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Title</th>
              <th className="py-3 px-6 text-center">Status</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {mockTasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 px-6 text-center">
                  No tasks found.
                </td>
              </tr>
            ) : (
              mockTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {task.id}
                  </td>
                  <td className="py-3 px-6 text-left">{task.title}</td>
                  <td className="py-3 px-6 text-center">
                    <span
                      className={`py-1 px-3 rounded-full text-xs ${
                        task.status === "Completed"
                          ? "bg-green-200 text-green-600"
                          : task.status === "In Progress"
                          ? "bg-yellow-200 text-yellow-600"
                          : "bg-red-200 text-red-600"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center">
                      {/* TODO: Add View/Edit/Delete buttons */}
                      <button className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                        {/* Placeholder for View Icon */}
                        👁️
                      </button>
                      <button className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                        {/* Placeholder for Edit Icon */}
                        ✏️
                      </button>
                      <button className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                        {/* Placeholder for Delete Icon */}
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
