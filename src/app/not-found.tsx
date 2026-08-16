"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center space-y-6">
        {/* Status Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold text-xl">
          404
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Page Not Found</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved to another URL.
          </p>
        </div>

        {/* Dynamic Return Action */}
        <div className="pt-2">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition duration-150 shadow-sm"
          >
            &larr; Back to {user ? "Dashboard" : "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}
