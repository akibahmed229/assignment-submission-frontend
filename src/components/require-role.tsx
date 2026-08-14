import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

export function RequiredRole({ role, children }: { role: Role[], children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !role.includes(user.role)) {
    return <p className="text-red-600">You don&apos;t have access to this page.</p>
  }

  return <>{children}</>
}
