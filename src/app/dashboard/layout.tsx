"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation"; // 1. Import usePathname
import Link from "next/link";
import { Role } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // 2. Get the current active path

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8"> Loading....</div>;

  interface LinkItem {
    href: string;
    label: string;
    roles: Role[];
  }

  const rawLinks: LinkItem[] = [
    { href: "/dashboard/assignments", label: "Assignments", roles: ["Admin", "Teacher", "Student"] },
    { href: "/dashboard/classes", label: "Classes", roles: ["Admin"] },
    { href: "/dashboard/subjects", label: "Subjects", roles: ["Admin"] },
    { href: "/dashboard/teacher-assignments", label: "Teacher Assignments", roles: ["Admin"] },
    { href: "/dashboard/enrollments", label: "Enrollments", roles: ["Admin"] },
    { href: "/dashboard/users", label: "User Management", roles: ["Admin"] },
    { href: "/dashboard/submissions", label: "All Submissions", roles: ["Admin"] },
  ];

  const links = rawLinks.filter((link) => link.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="bg-gray-900 text-white md:w-56 md:min-h-screen p-4 flex md:flex-col justify-between">
        <div className="flex md:flex-col gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="font-bold text-lg mb-4 hover:text-blue-400 transition-colors px-2"
          >
            ASM System
          </Link>

          {links.map((link) => {
            // 3. Check if current pathname matches or starts with the link route
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium ${isActive
                  ? "bg-blue-600 text-white" // Active styles
                  : "text-gray-300 hover:text-white hover:bg-gray-800" // Default styles
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-800">
          <div className="mb-4 px-2">
            <p className="font-semibold text-sm">{user.fullName}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>

          <button
            className="w-full text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg px-3 py-2 font-medium transition-colors text-left"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
