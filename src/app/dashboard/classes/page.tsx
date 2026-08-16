"use client"

import { useState, useEffect } from 'react'
import { useAuth } from "@/lib/auth-context";
import { SchoolClass } from "@/lib/types";
import z from "zod";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, ApiError } from '@/lib/api';
import { endpoints } from '@/lib/endpoints';
import { RequiredRole } from '@/components/require-role';

const schema = z.object({ name: z.string().min(1, "Name is required") });
type FormData = z.infer<typeof schema>;


export default function ClassesPage() {
  const { user } = useAuth();

  const [classes, setClasses] = useState < SchoolClass[] > ([]);
  const [error, setError] = useState < string | null > (null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm < FormData > ({
    resolver: zodResolver(schema),
  })

  async function load() {
    setClasses(await api.get < SchoolClass[] > (endpoints.schoolClasses));
  }

  useEffect(() => { load(); }, [])

  async function onSubmit(data: FormData) {
    setError(null);

    try {
      await api.post < SchoolClass > (endpoints.schoolClasses, data);
      reset();
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to crate class");
    }
  }

  async function onDelete(id: string) {
    try {
      if (!confirm("Delete this class?")) return;

      await api.delete < void> (endpoints.schoolClassesById(id));
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to delete class");
    }
  }

  return (
    <RequiredRole role={["Admin"]} msg='classes'>

      <div className='space-y-6'>
        <h1 className="text-2xl font-semibold">Classes</h1>

        {user?.role === "Admin" && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='flex gap-2 items-start max-w-md'>
            <div>
              <input {...register("name")} placeholder='e.g. Grade 10 - A' className='w-full border rounded px-3 py-2' />
              {errors.name && <p className='text-red-600 text-sm mt-1'>{errors.name.message}</p>}
            </div>

            <button
              disabled={isSubmitting}
              type='submit'
              className='bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-blue-700'>
              Add
            </button>
          </form>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left border-b'>
              <th className='py-2'>Name</th>
              <th className='py-2'>Created</th>
              {user?.role === "Admin" && <th className='py-2'></th>}
            </tr>
          </thead>

          <tbody>
            {classes.map(c => (
              <tr key={c.id} className='border-b'>
                <td className='py-2'>{c.name}</td>
                <td className='py-2'>{new Date(c.createdAt).toLocaleDateString()}</td>
                {user?.role === "Admin" && (
                  <td className='py-2'>
                    <button
                      className='bg-red-100 rounded text-red-600 px-2 py-1 hover:underline text-xs'
                      onClick={() => onDelete(c.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequiredRole>
  )
}
