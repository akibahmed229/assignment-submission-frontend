"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { object, Schema, z } from "zod";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Assignment, TeacherAssignment } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";


const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z.coerce.number().int().min(1, "Must be at least 1"),
  schoolClassId: z.string().min(1, "Select a class"),
  subjectId: z.string().min(1, "Select a subject"),
})

type FormInput = z.input<typeof schema>;   // shape BEFORE coercion — maxMarks is unknown/string here
type FormOutput = z.output<typeof schema>; // shape AFTER coercion — maxMarks is number here


export default function AssignmentsPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [myTeaching, setMyTeaching] = useState<TeacherAssignment[]>([]); // only populated for Teacher
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
  });

  const selectedClassId = watch("schoolClassId");

  async function load() {
    setAssignments(await api.get<Assignment[]>(endpoints.assignmentsMine));

    if (user?.role === "Teacher") {
      setMyTeaching(await api.get<TeacherAssignment[]>(endpoints.teacherAssignmentsMine))
    }
  }

  useEffect(() => { load() }, [user]);

  // Unique classes/subjects derived from what this teacher is actually
  // assigned to teach -- prevents them from picking a combination the
  // backend will reject with ForbiddenAccessException anyway.
  const availableClasses = Array.from(
    new Map(myTeaching.map(t => [t.schoolClassId, { id: t.schoolClassId, name: t.schoolClassName }])).values()
  )

  const availableSubjectsForClass = myTeaching
    .filter(t => t.schoolClassId === selectedClassId)
    .map(t => ({ id: t.subjectId, name: t.subjectName }));

  async function onSubmit(data: FormOutput) {
    setError(null);

    try {
      await api.post<Assignment>(endpoints.assignments, {
        ...data,
        deadline: new Date(data.deadline).toISOString()
      });

      reset();
      setShowForm(false);

      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to create assignment");
    }
  }

  async function onPublish(id: string) {
    try {
      await api.patch<Assignment>(endpoints.assignmentPublish(id));
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to publish assignment");
    }
  }

  async function onDelete(id: string) {
    try {
      if (!confirm("Delete this assignment?")) return;

      await api.delete<void>(endpoints.assignmentById(id));
      await load();
    } catch (err: any) {
      setError(err?.name === "ApiError" ? err.message : "Failed to delete assignment");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Assignments</h1>
        {user?.role === "Teacher" && (
          <button onClick={() => setShowForm(v => !v)} className="bg-blue-600 text-white rounded px-4 py-2 text-sm">
            {showForm ? "Cancel" : "New Assignment"}
          </button>
        )}
      </div>

      {user?.role === "Teacher" && myTeaching.length === 0 && (
        <p className="text-sm text-amber-600">
          You&apos;re not assigned to teach any class/subject yet — ask an Admin to set that up first.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full border rounded-lg p-4 space-y-3  bg-gray-50">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input {...register("title")} className="w-full border rounded px-3 py-2" />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input {...register("description")} className="w-full border rounded px-3 py-2" />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-35">
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input {...register("deadline")} type="datetime-local" className="w-full border rounded px-3 py-2" />
              {errors.deadline && <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>}
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium mb-1">Max Marks</label>
              <input {...register("maxMarks")} type="number" className="w-full border rounded px-3 py-2" />
              {errors.maxMarks && <p className="text-red-600 text-sm mt-1">{errors.maxMarks.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-35">
              <label className="block text-sm font-medium mb-1">Class</label>
              <select {...register("schoolClassId")} className="w-full border rounded px-3 py-2" defaultValue="">
                <option value="" disabled>Select...</option>
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.schoolClassId && <p className="text-red-600 text-sm mt-1">{errors.schoolClassId.message}</p>}
            </div>

            <div className="flex-1 min-w-35">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <select {...register("subjectId")} className="w-full border rounded px-3 py-2" defaultValue="">
                <option value="" disabled>Select...</option>
                {availableSubjectsForClass.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.subjectId && <p className="text-red-600 text-sm mt-1">{errors.subjectId.message}</p>}
            </div>
          </div>

          <button disabled={isSubmitting} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
            Create (as Draft)
          </button>
        </form>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        {assignments.map(a => (
          <div key={a.id} className="border rounded-lg p-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href={`/dashboard/assignments/${a.id}`} className="font-medium hover:underline">
                {a.title}
              </Link>
              <p className="text-sm text-gray-500">
                Due {new Date(a.deadline).toLocaleString()} · Max {a.maxMarks} marks
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded ${a.status === "Published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
              >
                {a.status}
              </span>

              {user?.role === "Teacher" && a.status === "Draft" && (
                <button onClick={() => onPublish(a.id)} className="text-blue-600 hover:underline text-xs">
                  Publish
                </button>
              )}
              {(user?.role === "Teacher" || user?.role === "Admin") && (
                <button onClick={() => onDelete(a.id)} className="bg-red-100 text-red-600 px-2 py-1 hover:underline rounded text-xs">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-gray-500 text-sm">No assignments yet.</p>}
      </div>
    </div>
  )
}
