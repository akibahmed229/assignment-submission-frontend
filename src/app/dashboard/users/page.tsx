"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { UserSummary, Role } from "@/lib/types";
import { endpoints } from "@/lib/endpoints";

// Form schema using Zod
const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Teacher", "Student"], {
    message: "Please select a valid role",
  }),
  isActive: z.boolean()
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState < UserSummary[] > ([]);
  const [selectedRole, setSelectedRole] = useState < Role | "All" > ("All");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [serverError, setServerError] = useState < string | null > (null);
  const [successMessage, setSuccessMessage] = useState < string | null > (null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm < CreateUserForm > ({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "Student",
      isActive: true
    },
  });

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const url = selectedRole === "All"
        ? endpoints.users()
        : endpoints.users(selectedRole);

      const data = await api.get < UserSummary[] > (url);

      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Submit handler to register a new user
  async function onSubmit(data: CreateUserForm) {
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.post < UserSummary > (endpoints.register, data);
      setSuccessMessage(`User "${data.fullName}" created successfully as ${data.role}!`);
      reset();
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setServerError(
        err?.name === "ApiError" ? err.message : "Failed to create user. Please try again."
      );
    }
  }

  async function onToggleStatus(u: UserSummary) {
    await api.patch(endpoints.userStatus(u.id), { isActive: !u.isActive });
    fetchUsers();
  }


  // Guard: Only Admin allowed
  if (user?.role !== "Admin") {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <h2 className="font-bold text-lg">Access Denied</h2>
        <p className="text-sm">You must be an Administrator to manage users.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create new system accounts and view registered users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create User Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Add New User
          </h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md">
              {successMessage}
            </div>
          )}

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...register("fullName")}
                type="text"
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.fullName && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="user@school.local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assign Role
              </label>
              <select
                {...register("role")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium transition duration-150 disabled:opacity-50"
            >
              {isSubmitting ? "Creating User..." : "Create Account"}
            </button>
          </form>
        </div>

        {/* Right Column: User List */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 ">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Registered Users
            </h2>

            {/* Filter by Role */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filter:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role | "All")}
                className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No users found for this role filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 rounded-r-lg">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.fullName}
                      </td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${u.role === "Admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : u.role === "Teacher"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full ${u.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => onToggleStatus(u)} className="text-xs text-blue-600 hover:underline">
                          {u.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
