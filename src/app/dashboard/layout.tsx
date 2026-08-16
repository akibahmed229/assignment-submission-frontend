"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Role } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu toggle state

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Close mobile drawer when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (loading || !user) return <div className="p-8">Loading...</div>;

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
      {/* Top Navbar for Mobile */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center md:hidden border-b border-gray-800">
        <Link href="/dashboard" className="font-bold text-lg hover:text-blue-400 transition-colors">
          ASM System
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded text-gray-300 hover:text-white focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Sidebar (Collapsible on Mobile, Fixed Sidebar on Desktop) */}
      <nav
        className={`${isOpen ? "flex" : "hidden"
          } md:flex bg-gray-900 text-white md:w-56 md:min-h-screen p-4 flex-col justify-between shrink-0`}
      >
        {/* Top Section: App Title & Links */}
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="hidden md:block font-bold text-lg mb-4 hover:text-blue-400 transition-colors px-2"
          >
            ASM System
          </Link>

          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-3 py-2 rounded-lg transition-colors font-medium ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section: Fixed to Bottom via Flexbox */}
        <div className="pt-4 border-t border-gray-800 mt-auto">
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
