export type Role = "Admin" | "Teacher" | "Student";
export type AssignmentStatus = "Draft" | "Published"
export type SubmissionStatus = "Submitted" | "Late" | "Graded";

export interface AuthResponse {
    userId: string;
    fullName: string;
    email: string;
    role: Role;
    token: string;
}

export interface UserSummary {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isActive: boolean;
}

export interface SchoolClass {
    id: string;
    name: string;
    createdAt: string;
}

export interface Subject {
    id: string;
    name: string;
    code: string | null;
    createdAt: string;
}

export interface TeacherAssignment {
    id: string;
    teacherId: string;
    teacherName: string;
    schoolClassId: string;
    schoolClassName: string;
    subjectId: string;
    subjectName: string;
}

export interface StudentEnrollment {
    id: string;
    studentId: string;
    studentName: string;
    schoolClassId: string;
    schoolClassName: string;
}

export interface Assignment {
    id: string;
    title: string;
    description: string;
    deadline: string;
    maxMarks: number;
    status: AssignmentStatus;
    teacherId: string;
    schoolClassId: string;
    subjectId: string;
    createdAt: string;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    answerText: string;
    submittedAt: string;
    status: SubmissionStatus;
    marks: number | null;
    feedback: string | null;
    gradedAt: string | null;
}

export interface SubmissionOverview {
    id: string;
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    studentName: string;
    submittedAt: string;
    status: SubmissionStatus;
    marks: number | null;
    maxMarks: number;
}
