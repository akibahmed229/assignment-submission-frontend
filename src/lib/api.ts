const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

function getToken(): string | null {
    if (typeof window === "undefined") return null; // guards against SSR calling this
    return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    })

    if (res.status == 204) return undefined as T; // NoContent, e.g. DELETE

    const body = await res.json().catch(() => null);

    if (!res.ok) {
        const message = body?.message ||
            body?.message?.Error ||
            body?.data?.message ||
            body?.title ||
            `Request failed (${res.status})` ||
            "Something Worng!!!!";

        throw new ApiError(res.status, message);
    }

    return body as T;
}

export const api = {
    get: <T>(path: string) => request<T>(path),

    post: <T>(path: string, data?: unknown) =>
        request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),

    put: <T>(path: string, data?: unknown) =>
        request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),

    patch: <T>(path: string, data?: unknown) =>
        request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),


    delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
}
