"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email!"),
  password: z.string().min(1, "password is required")
})

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState < string | null > (null);


  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm < LoginForm > ({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setServerError(null);

    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setServerError(err?.name === "ApiError" ? err.message : "Login failed. Try again.");

    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="flex justify-center items-center text-xl font-semibold mb-10">Sign in</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register("email")} type="email" className="w-full border rounded px-3 py-2 mb-3" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email?.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input {...register("password")} type="password" className="w-full rounded border px-3 py-2 mb-3" />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-red-600 text-sm"> {serverError}</p>}

        <button
          className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-gray-500 mt-10">
          Demo: admin@assignmentsystem.local / teacher@assignmentsystem.local / student@assignmentsystem.local
        </p>
      </form>
    </div >
  )
}
