const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const sessionKey = "portfolio-admin-session";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(sessionKey) || "null");
    } catch {
        return null;
    }
}

function saveSession(session) {
    localStorage.setItem(sessionKey, JSON.stringify({
        ...session,
        expires_at: Date.now() + (session.expires_in || 3600) * 1000
    }));
}

async function request(path, options = {}, useSession = false) {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured. Add the required VITE_SUPABASE environment variables.");
    }

    let session = useSession ? getSession() : null;
    if (useSession && (!session?.access_token || session.expires_at < Date.now() + 30000)) {
        if (!session?.refresh_token) {
            throw new Error("Your admin session has expired. Please sign in again.");
        }
        const refreshed = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: session.refresh_token })
        });
        const refreshedData = await refreshed.json();
        if (!refreshed.ok) {
            localStorage.removeItem(sessionKey);
            throw new Error(refreshedData.msg || refreshedData.message || "Your admin session has expired. Please sign in again.");
        }
        saveSession(refreshedData);
        session = getSession();
    }

    const response = await fetch(`${supabaseUrl}${path}`, {
        ...options,
        headers: {
            apikey: supabaseAnonKey,
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        throw new Error(`Supabase returned an invalid response (${response.status}).`);
    }
    if (!response.ok) {
        throw new Error(data?.message || data?.msg || data?.error_description || data?.error || `Supabase request failed (${response.status}).`);
    }
    return data;
}

export async function signIn(email, password) {
    const session = await request("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    saveSession(session);
}

export function signOut() {
    localStorage.removeItem(sessionKey);
}

export function hasSession() {
    return Boolean(getSession()?.access_token);
}

export async function getPortfolio() {
    const rows = await request("/rest/v1/portfolio_content?id=eq.site&select=content");
    if (!rows?.[0]?.content) {
        throw new Error("Portfolio content was not found. Run supabase/schema.sql in your Supabase project.");
    }
    return rows[0].content;
}

export async function verifyAdmin() {
    const isAdmin = await request("/rest/v1/rpc/is_portfolio_admin", {
        method: "POST",
        body: JSON.stringify({})
    }, true);
    return isAdmin === true;
}

export async function savePortfolio(content) {
    await request("/rest/v1/portfolio_content?id=eq.site", {
        method: "PATCH",
        body: JSON.stringify({ content, updated_at: new Date().toISOString() }),
        headers: { Prefer: "return=minimal" }
    }, true);
}

export async function uploadAsset(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const mimeExtensions = {
        "image/jpeg": ["jpg", "jpeg"],
        "image/png": ["png"],
        "image/webp": ["webp"],
        "image/gif": ["gif"],
        "application/pdf": ["pdf"]
    };
    if (!mimeExtensions[file.type]?.includes(extension)) {
        throw new Error("Only JPG, PNG, WebP, GIF and PDF files are supported.");
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error("Files must be 10 MB or smaller.");
    }

    const path = `${crypto.randomUUID()}.${extension}`;
    await request(`/storage/v1/object/portfolio-assets/${path}`, {
        method: "POST",
        body: file,
        headers: {
            "Content-Type": file.type,
            "x-upsert": "false"
        }
    }, true);

    return {
        path,
        url: `${supabaseUrl}/storage/v1/object/public/portfolio-assets/${path}`
    };
}

export async function deleteAssets(paths) {
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    if (uniquePaths.length) {
        await request("/storage/v1/object/portfolio-assets", {
            method: "DELETE",
            body: JSON.stringify({ prefixes: uniquePaths })
        }, true);
    }
}

export async function getMessages() {
    return request("/rest/v1/contact_messages?select=id,name,email,subject,message,created_at&order=created_at.desc", {}, true);
}

export async function deleteMessage(id) {
    await request(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
    }, true);
}
