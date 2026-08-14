"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { RequiredRole } from "@/components/require-role";
import { TeacherAssignment, UserSummary, SchoolClass, Subject } from "@/lib/types";
import { endpoints } from "@/lib/endpoints";

const schema = z.object({
  teacherId: z.string().min(1, "Select a teacher"),
  schoolClassId: z.string().min(1, "Select a class"),
  subjectId: z.string().min(1, "Select a subject")
})
type FormData = z.infer<typeof schema>;

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignment] = useState < TeacherAssignment[] > ([]);
  const [teachers, setTeacher] = useState < UserSummary[] > ([]);
  const [classes, setClasses] = useState < SchoolClass[] > ([]);
  const [subjects, setSubject] = useState < Subject[] > ([]);
  const [error, setError] = useState < string | null > (null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm < FormData > ({
    resolver: zodResolver(schema)
  })

  async function loadAll() {
    const [a, t, c, s] = await Promise.all([
      api.get < TeacherAssignment[] > (endpoints.teacherAssignments),
      api.get < UserSummary[] > (endpoints.users("Teacher")),
      api.get < SchoolClass[] > (endpoints.schoolClasses),
      api.get < Subject[] > (endpoints.subjects),
    ])

    setAssignment(a);
    setTeacher(t);
    setClasses(c);
    setSubject(s);
  }

  useEffect(() => { loadAll() }, []);

  async function onSubmit(data: FormData) {
    setError(null);

    try {
      await api.post < TeacherAssignment > (endpoints.teacherAssignments, data);
      reset();
      await loadAll();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to create assignment");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this teacher assignments?")) return;

    await api.delete < void> (endpoints.teacherAssignmentsById(id));
    await loadAll();

    try {

    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to delete assignment");
    }
  }

  return (
    <RequiredRole role={["Admin"]}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Teacher Assignments</h1>
        <p className="text-sm text-gray-500">Assign a teacher to teach a subject for a class.</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex gap-2 items-start flex-wrap max-w-3xl">
          <div className="flex-1 min-w-40">
            <select {...register("teacherId")} defaultValue="" className="w-full border rounded px-3 py-2">
              <option value="" disabled>Teacher...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
            {errors.teacherId && <p className="text-red-600 text-sm mt-1">{errors.teacherId.message}</p>}
          </div>

          <div className="flex-1 min-w-40">
            <select {...register("schoolClassId")} defaultValue="" className="w-full border rounded px-3 py-2">
              <option value="" disabled>Class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.schoolClassId && <p className="text-red-600 text-sm mt-1">{errors.schoolClassId.message}</p>}
          </div>

          <div className="flex-1 min-w-40">
            <select {...register("subjectId")} defaultValue="" className="w-full border rounded px-3 py-2">
              <option value="" disabled>Subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.subjectId && <p className="text-red-600 text-sm mt-1">{errors.subjectId.message}</p>}
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-blue-700">
            Assign
          </button>
        </form>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {teachers.length === 0 && (
          <p className="text-sm text-amber-600">
            No teachers found — register a user with the Teacher role first.
          </p>
        )}

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Teacher</th>
              <th className="py-2">Class</th>
              <th className="py-2">Subject</th>
              <th className="py-2"></th>
            </tr>
          </thead>

          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-b">
                <td className="py-2">{a.teacherName}</td>
                <td className="py-2">{a.schoolClassName}</td>
                <td className="py-2">{a.subjectName}</td>
                <td className="py-2">
                  <button onSubmit={() => onDelete(a.id)} className="bg-red-100 rounded text-red-600 px-2 py-1 hover:underline text-xs">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequiredRole >
  )
}
