"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Subject } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  code: z.string().max(20).optional()
})
type FormData = z.infer<typeof schema>;

export default function SubjectsPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState < Subject[] > ([]);
  const [error, setError] = useState < string | null > (null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm < FormData > ({
    resolver: zodResolver(schema),
  });

  async function load() {
    setSubjects(await api.get < Subject[] > (endpoints.subjects));
  }

  useEffect(() => { load(); }, [])

  async function onSubmit(data: FormData) {
    setError(null);

    try {
      await api.post < Subject > (endpoints.subjects, data);
      reset();
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to create subject");
    }
  }

  async function onDelete(id: string) {
    try {
      if (!confirm("Delete the subject?")) return;

      await api.delete < void> (endpoints.subjectsById(id));
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to delete subject");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Subjects</h1>

      {user?.role === "Admin" && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-start max-w-lg flex-wrap">
          <div className="flex-1 min-w-40">
            <input {...register("name")} placeholder="e.g. Mathematics" className="w-full border rounded px-3 py-2" />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div className="w-32">
            <input {...register("code")} placeholder="MATH101" className="w-full border rounded px-3 py-2" />
          </div>
          <button disabled={isSubmitting} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-blue-700">
            Add
          </button>
        </form>
      )
      }
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th className="py-2">Code</th>
            {user?.role === "Admin" && <th className="py-2"></th>}
          </tr>
        </thead>

        <tbody>
          {subjects.map(s => (
            <tr key={s.id} className="border-b">
              <td className="py-2">{s.name}</td>
              <td className="py-2 text-gray-500">{s.code ?? "--"}</td>
              {user?.role === "Admin" && (
                <td className="py-2">
                  <button onClick={() => onDelete(s.id)} className="bg-red-100 rounded text-red-600 px-2 py-1 hover:underline text-xs">
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div >


  )
}
