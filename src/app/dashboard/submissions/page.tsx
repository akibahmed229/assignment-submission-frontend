"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { SubmissionOverview, SubmissionStatus } from "@/lib/types";
import { RequiredRole } from "@/components/require-role";

// Graded is deliberately excluded here -- the backend's ChangeStatusAsync
// rejects that transition on purpose (it requires marks, which only the
// grade endpoint on the assignment detail page collects). Offering it here
// would just produce a 400 on every attempt.
const CHANGEABLE_STATUSES: SubmissionStatus[] = ["Submitted", "Late"];

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  Submitted: "bg-gray-100 text-gray-600",
  Late: "bg-amber-100 text-amber-700",
  Graded: "bg-green-100 text-green-700",
};

export default function AllSubmissionsPage() {
  const [submissions, setSubmissions] = useState < SubmissionOverview[] > ([]);
  const [statusFilter, setStatusFilter] = useState < SubmissionStatus | "All" > ("All");
  const [error, setError] = useState < string | null > (null);
  const [savingId, setSavingId] = useState < string | null > (null);


  async function load() {
    setError(null);
    try {
      setSubmissions(await api.get < SubmissionOverview[] > (endpoints.submissionsAll));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load submissions");
    }
  }

  useEffect(() => { load(); }, []);

  async function onChangeStatus(id: string, status: SubmissionStatus) {
    setSavingId(id);
    setError(null);
    try {
      await api.patch(endpoints.submissionStatus(id), { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setSavingId(null);
    }
  }

  const visible = statusFilter === "All"
    ? submissions
    : submissions.filter((s) => s.status === statusFilter);

  return (
    <RequiredRole role={["Admin", "Teacher"]} msg="submissions">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-semibold">All Submissions</h1>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | "All")}
              className="border rounded px-2.5 py-1 text-xs bg-white"
            >
              <option value="All">All statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Late">Late</option>
              <option value="Graded">Graded</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Student</th>
                <th className="py-2">Assignment</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Status</th>
                <th className="py-2">Marks</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.studentName}</td>
                  <td className="py-2">
                    <Link href={`/dashboard/assignments/${s.assignmentId}`} className="hover:underline">
                      {s.assignmentTitle}
                    </Link>
                  </td>
                  <td className="py-2 text-gray-500">{new Date(s.submittedAt).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {s.marks !== null ? `${s.marks} / ${s.maxMarks}` : "—"}
                  </td>
                  <td className="py-2">
                    {s.status === "Graded" ? (
                      <span className="text-xs text-gray-400">Graded — edit via assignment page</span>
                    ) : (
                      <select
                        defaultValue={s.status}
                        disabled={savingId === s.id}
                        onChange={(e) => onChangeStatus(s.id, e.target.value as SubmissionStatus)}
                        className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {CHANGEABLE_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-500">No submissions match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RequiredRole>
  );
}
