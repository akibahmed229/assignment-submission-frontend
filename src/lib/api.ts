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

// Clears the stale session and forces a full navigation to /login.
// A full page reload (not router.push) is deliberate here: it guarantees
// every component's React state resets cleanly, rather than trying to
// reason about which in-flight requests/effects need to notice the logout
// mid-render.
function forceLogout(): void | null {
    if (typeof window === undefined) return null;

    localStorage.removeItem("token");
    localStorage.removeItem("token");

    // Avoid a redirect loop if this fires while already on /login, and skip
    // it if a redirect is already underway (e.g. multiple requests failing
    // at once when a page loads and fires several API calls in parallel).
    if (window.location.pathname !== "/login") {
        window.location.href = "/login?sessionExpired=1";
    }
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


    // A 401 on a request that DID carry a token means the token itself is
    // no longer valid (expired, or the server's Jwt:Secret changed) -- not
    // "wrong credentials", since that path never attaches a token in the
    // first place (see login() in auth-context.tsx, which calls this same
    // request() before any token exists). Only auto-logout in that case.
    if (res.status === 401 && token) {
        forceLogout();

        // Throw anyway so callers' .catch()/try-catch don't silently continue
        // as if the request succeeded -- forceLogout() is about to navigate
        // away, but any code between here and the navigation should still see
        // this as a failure.
        throw new ApiError(res.status, "Your session has expired. Please log in again.");
    }

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
