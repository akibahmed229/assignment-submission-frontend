export const endpoints = {
    login: "/auth/login",
    register: "/auth/register",

    schoolClasses: "/schoolclass",
    schoolClassesById: (classId: string) => `/schoolclass/${classId}`,

    subjects: "/subject",
    subjectsById: (subjectId: string) => `/subject/${subjectId}`,

    teacherAssignments: "/teacherassignments",
    teacherAssignmentsMine: "/teacherassignments/mine",
    teacherAssignmentsById: (id: string) => `/teacherassignments/${id}`,

    studentEnrollments: "/studentenrollments",
    studentEnrollmentsId: (id: string) => `/studentenrollments/${id}`,
    studentEnrollmentsByClass: (classId: string) => `/studentenrollments/class/${classId}`,

    assignments: "/assignments",
    assignmentsMine: "/assignments/mine",
    assignmentById: (id: string) => `/assignments/${id}`,
    assignmentPublish: (id: string) => `/assignments/${id}/publish`,
    assignmentSubmissions: (assignmentId: string) => `/assignments/${assignmentId}/submissions`,

    submissionUpdate: (id: string) => `/submissions/${id}`,
    submissionGrade: (id: string) => `/submissions/${id}/grade`,
    submissionsMine: "/submissions/mine",
    submissionsAll: "/submissions",
    submissionStatus: (id: string) => `/submissions/${id}/status`,

    userStatus: (id: string) => `/users/${id}/status`,
    users: (role?: string) => (role ? `/users?role=${role}` : "/users"),
} as const;
