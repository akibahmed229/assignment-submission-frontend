import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

export function RequiredRole({ role, msg = "this page", children }: { role: Role[], msg: string, children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !role.includes(user.role)) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <h2 className="font-bold text-lg">Access Denied</h2>
        <p className="text-sm">You must be an Administrator to manage {msg}.</p>
      </div>
    );

  }

  return <>{children}</>
}
