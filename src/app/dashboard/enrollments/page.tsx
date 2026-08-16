"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { StudentEnrollment, UserSummary, SchoolClass } from "@/lib/types";
import { RequiredRole } from "@/components/require-role";
import { endpoints } from "@/lib/endpoints";


const schema = z.object({
  studentId: z.string().min(1, "Student id is required")
})
type FormData = z.infer<typeof schema>;

export default function EnrollmentsPage() {
  const [classes, setClasses] = useState < SchoolClass[] > ([]);
  const [selectedClassId, setSelectedClassId] = useState < string > ("");
  const [students, setStudents] = useState < UserSummary[] > ([]);
  const [enrollments, setEnrollments] = useState < StudentEnrollment[] > ([]);
  const [error, setError] = useState < string | null > (null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm < FormData > ({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    Promise.all([
      api.get < SchoolClass[] > (endpoints.schoolClasses),
      api.get < UserSummary[] > (endpoints.users("Student")),
    ]).then(([c, s]) => {
      setClasses(c);
      setStudents(s);

      if (c.length > 0) setSelectedClassId(c[0].id) // default to first class so the page isn't empty on load
    })
  }, []);

  async function loadEnrollments(classId: string) {
    if (!classId) return;
    setEnrollments(await api.get < StudentEnrollment[] > (endpoints.studentEnrollmentsByClass(classId)));
  }

  useEffect(() => {
    loadEnrollments(selectedClassId);
  }, [selectedClassId])

  async function onSubmit(data: FormData) {
    setError(null);

    try {
      await api.post < StudentEnrollment > (endpoints.studentEnrollments, { studentId: data.studentId, schoolClassId: selectedClassId })
      reset()
      await loadEnrollments(selectedClassId);
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to enrolle student into class");
    }
  }

  async function onDelete(id: string) {
    try {
      if (!confirm("Remove this student from the class?")) return;
      await api.delete(endpoints.studentEnrollmentsId(id));
      await loadEnrollments(selectedClassId);
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to remove enrolled student from class");
    }
  }

  return (
    <RequiredRole role={["Admin"]} msg="enrollments">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Enrollments</h1>

        <div className="max-w-xs">
          <label className="block  text-2xl font-medium mb-1">Classes</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full border rounded px-3 py-2">
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 flex-wrap items-start max-w-md">
              <div className="flex-1">
                <select {...register("studentId")} className="w-full border rounded px-3 py-2" defaultValue="">
                  <option value="" disabled>Student...</option>
                  {students
                    .filter(s => !enrollments.some(e => e.studentId === s.id)) // hide already-enrolled students from the picker
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                </select>
                {errors.studentId && <p className="text-red-600 text-sm mt-1">{errors.studentId.message}</p>}
              </div>

              <button disabled={isSubmitting} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
                Enroll
              </button>
            </form>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2" >Student</th>
                  <th className="py-2" >Class</th>
                  <th className="py-2" ></th>
                </tr>
              </thead>

              <tbody>
                {enrollments.map(e => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2" >{e.studentName}</td>
                    <td className="py-2" >{e.schoolClassName}</td>
                    <td className="py-2" >
                      <button onClick={() => onDelete(e.id)} className="bg-red-100 rounded text-red-600 px-2 py-1 hover:underline text-xs">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {enrollments.length === 0 && (
                  <tr><td className="py-2 text-gray-500" colSpan={2}>No students enrolled yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </RequiredRole>
  )
}
