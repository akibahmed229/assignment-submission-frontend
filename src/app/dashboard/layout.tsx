"use client"

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router])

  if (loading || !user) return <div className="p-8"> Loading....</div>

  const links = [
    { href: "/dashboard/assignments", label: "Assignments", roles: ["Admin", "Teacher", "Student"] },
    { href: "/dashboard/classes", label: "Classes", roles: ["Admin"] },
    { href: "/dashboard/subjects", label: "Subjects", roles: ["Admin"] },
    { href: "/dashboard/teacher-assignments", label: "Teacher Assignments", roles: ["Admin"] },
    { href: "/dashboard/enrollments", label: "Enrollments", roles: ["Admin"] },
    { href: "/dashboard/submissions", label: "All Submissions", roles: ["Admin"] },
  ].filter(link => link.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="bg-gray-900 text-white md:w-56 md:min-h-screen p-4 flex md:flex-col justify-between">
        <div className="flex md:flex-col gap-2 flex-wrap">
          <div className="mb-4 hidden md:block">
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>

          {links.map(link => (
            <Link key={link.href} href={link.href} className="text-sm hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-800">
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="text-md bg-red-100 rounded text-red-500 hover:text-red-400 px-2 py-1"
          onClick={logout}>
          Log out
        </button>
      </nav>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
