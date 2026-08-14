"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // 1. Role-based overview messaging & metadata
  const roleDetails = {
    Admin: {
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      title: "System Administrator — You have full access to manage users, classes, subjects, teacher assignments, and system-wide enrollments.",
      points: [
        "User & Academic Setup: Create and manage users (teachers/students), classes/courses, and subjects.",
        "Assignments & Enrollments: Map teachers to specific classes/subjects and enroll students into classes.",
        "System Overview: View all assignments, student submissions, and application-level settings across the entire platform.",
      ],
    },
    Teacher: {
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      title: "Educator — Manage your assigned subjects, draft/publish assignments, review student submissions, and assign grades with feedback.",
      points: [
        "Assignment Management: Create, update, and delete assignments for assigned classes and subjects.",
        "Publishing Control: Toggle assignments between Draft and Published states.",
        "Grading & Review: View submissions, assign marks, enter feedback, and adjust submission statuses.",
      ],
    },
    Student: {
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      title: "Student — View assignments for enrolled classes, submit your work before deadlines, and track your grades and teacher feedback.",
      points: [
        "Assignment Feed: Browse published assignments specific to enrolled classes and view deadlines.",
        "Submissions: Submit answers to assignments and edit submissions before deadlines.",
        "Feedback & Grades: Track submission status, view awarded marks, and read teacher feedback.",
      ],
    },
  }[user.role];

  // 2. Action links configured per role
  const quickLinks = [
    {
      href: "/dashboard/assignments",
      title: "Assignments",
      description:
        user.role === "Student"
          ? "Browse and submit course assignments"
          : user.role === "Teacher"
            ? "Create, publish, and grade assignments"
            : "View all system assignments and submissions",
      roles: ["Admin", "Teacher", "Student"],
      badge: "Core",
    },
    {
      href: "/dashboard/classes",
      title: "Classes",
      description: "Manage school/college class sections",
      roles: ["Admin"],
    },
    {
      href: "/dashboard/subjects",
      title: "Subjects",
      description: "Define and manage academic subjects",
      roles: ["Admin"],
    },
    {
      href: "/dashboard/teacher-assignments",
      title: "Teacher Assignments",
      description: "Assign teachers to specific classes and subjects",
      roles: ["Admin"],
    },
    {
      href: "/dashboard/enrollments",
      title: "Student Enrollments",
      description: "Enroll students into their respective classes",
      roles: ["Admin"],
    },
    {
      href: "/dashboard/users",
      title: "Users Management",
      description: "Create and manage users (teachers/students)",
      roles: ["Admin"],
    },
  ].filter((link) => link.roles.includes(user.role));

  return (
    <div className="w-full space-y-6">
      {/* Role Profile Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.fullName}!
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${roleDetails.badgeColor}`}
          >
            {user.role} Account
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {/* Summary Header */}
          <p className="text-sm font-medium text-gray-800">{roleDetails.title}</p>

          {/* Numbered List */}
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
            {roleDetails.points.map((point, index) => (
              <li key={index} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Role Capabilities Quick Navigation */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {user.role} Management Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </h3>
                  {link.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Open module</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
