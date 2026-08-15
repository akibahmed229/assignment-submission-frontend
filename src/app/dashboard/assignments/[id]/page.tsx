"use client";

import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { Assignment, Submission, SubmissionStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const submitSchema = z.object({ answerText: z.string().min(1, "Answer is required") });
type SubmitFormData = z.infer<typeof submitSchema>;

const gradeSchema = z.object({
  marks: z.coerce.number().int().min(0, "Marks can't be negative"),
  feedback: z.string().optional(),
});
type GradeFormInput = z.input<typeof gradeSchema>;
type GradeFormOutput = z.output<typeof gradeSchema>;

// Graded is excluded -- the backend's ChangeStatusAsync rejects that
// transition on purpose; entering Graded status only happens through the
// grade form below, which requires marks.
const CHANGEABLE_STATUSES: SubmissionStatus[] = ["Submitted", "Late"];

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [assignment, setAssignment] = useState < Assignment | null > (null);
  const [submissions, setSubmissions] = useState < Submission[] > ([]);
  const [mySubmission, setMySubmission] = useState < Submission | null > (null);
  const [error, setError] = useState < string | null > (null);
  const [gradingId, setGradingId] = useState < string | null > (null);
  const [statusSavingId, setStatusSavingId] = useState < string | null > (null);

  const submitForm = useForm < SubmitFormData > ({ resolver: zodResolver(submitSchema) });
  const gradeForm = useForm < GradeFormInput, unknown, GradeFormOutput> ({ resolver: zodResolver(gradeSchema) });

  async function load() {
    setAssignment(await api.get < Assignment > (endpoints.assignmentById(id)));
    if (user?.role === "Admin" || user?.role === "Teacher") {
      setSubmissions(await api.get < Submission[] > (endpoints.assignmentSubmissions(id)));
    } else if (user?.role === "Student") {
      const mine = await api.get < Submission[] > (endpoints.submissionsMine);
      setMySubmission(mine.find((s) => s.assignmentId === id) ?? null);
    }
  }

  useEffect(() => { load(); }, [user]);

  async function onSubmitAnswer(data: SubmitFormData) {
    setError(null);
    try {
      if (mySubmission) {
        await api.put < Submission > (endpoints.submissionUpdate(mySubmission.id), data);
      } else {
        await api.post < Assignment > (endpoints.assignmentSubmissions(id), data);
      }
      submitForm.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    }
  }

  async function onGrade(submissionId: string, data: GradeFormOutput) {
    setError(null);
    try {
      await api.post < Submission > (endpoints.submissionGrade(submissionId), data);
      setGradingId(null);
      gradeForm.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to grade");
    }
  }

  async function onChangeStatus(submissionId: string, status: SubmissionStatus) {
    setStatusSavingId(submissionId);
    setError(null);
    try {
      await api.patch(endpoints.submissionStatus(submissionId), { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setStatusSavingId(null);
    }
  }

  if (!assignment) return <p>Loading...</p>;

  const deadlinePassed = new Date(assignment.deadline) < new Date();
  const canManageSubmissions = user?.role === "Admin" || user?.role === "Teacher"; // computed once, used below

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
        <p className="text-sm text-gray-500">
          Due {new Date(assignment.deadline).toLocaleString()} · Max {assignment.maxMarks} marks
          {deadlinePassed && <span className="text-red-600"> · Deadline passed</span>}
        </p>
      </div>

      <p className="whitespace-pre-wrap">{assignment.description}</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {user?.role === "Student" && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="font-medium">Your Submission</h2>

          {mySubmission?.status === "Graded" ? (
            <div className="space-y-1 text-sm">
              <p>Answer: {mySubmission.answerText}</p>
              <p className="font-medium">Marks: {mySubmission.marks} / {assignment.maxMarks}</p>
              {mySubmission.feedback && <p className="text-gray-600">Feedback: {mySubmission.feedback}</p>}
            </div>
          ) : (
            <form onSubmit={submitForm.handleSubmit(onSubmitAnswer)} className="space-y-2">
              <textarea
                {...submitForm.register("answerText")}
                defaultValue={mySubmission?.answerText ?? ""}
                rows={5}
                disabled={deadlinePassed && !!mySubmission}
                className="w-full border rounded px-3 py-2"
                placeholder="Write your answer..."
              />
              {submitForm.formState.errors.answerText && (
                <p className="text-red-600 text-sm">{submitForm.formState.errors.answerText.message}</p>
              )}
              <button disabled={submitForm.formState.isSubmitting} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
                {mySubmission ? "Update Submission" : "Submit"}
              </button>
              {mySubmission?.status === "Late" && (
                <p className="text-amber-600 text-sm">Marked as late — submitted after the deadline.</p>
              )}
            </form>
          )}
        </div>
      )}

      {/* Fixed: parentheses force || to evaluate before &&, so this
          actually renders for BOTH Admin and Teacher, not just Teacher. */}
      {canManageSubmissions && (
        <div className="space-y-3">
          <h2 className="font-medium">Submissions ({submissions.length})</h2>
          {submissions.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-gray-500">
                  Submitted {new Date(s.submittedAt).toLocaleString()}
                  {s.status === "Late" && <span className="text-amber-600"> · Late</span>}
                </p>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${s.status === "Graded" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.status}
                  </span>

                  {/* Status-change control -- independent of grading.
                      Lets a Teacher/Admin accept a Late submission as
                      on-time, etc., without forcing a full grade entry. */}
                  {s.status !== "Graded" && (
                    <select
                      defaultValue={s.status}
                      disabled={statusSavingId === s.id}
                      onChange={(e) => onChangeStatus(s.id, e.target.value as SubmissionStatus)}
                      className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {CHANGEABLE_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm">{s.answerText}</p>

              {s.status === "Graded" ? (
                <p className="text-sm font-medium">
                  Marks: {s.marks} / {assignment.maxMarks}
                  {s.feedback && <span className="font-normal text-gray-600"> — {s.feedback}</span>}
                </p>
              ) : gradingId === s.id ? (
                <form onSubmit={gradeForm.handleSubmit((data) => onGrade(s.id, data))} className="flex gap-2 items-start flex-wrap">
                  <div className="w-24">
                    <input {...gradeForm.register("marks")} type="number" placeholder="Marks" className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <input {...gradeForm.register("feedback")} placeholder="Feedback (optional)" className="flex-1 min-w-[140px] border rounded px-2 py-1 text-sm" />
                  <button className="bg-blue-600 text-white rounded px-3 py-1 text-sm">Save</button>
                  <button type="button" onClick={() => setGradingId(null)} className="text-sm text-gray-500">Cancel</button>
                </form>
              ) : (
                <button onClick={() => setGradingId(s.id)} className="text-blue-600 hover:underline text-sm">
                  Grade this submission
                </button>
              )}
            </div>
          ))}
          {submissions.length === 0 && <p className="text-gray-500 text-sm">No submissions yet.</p>}
        </div>
      )}
    </div>
  );
}
