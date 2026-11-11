import { API_CONFIG } from "./config";

const baseUrl = API_CONFIG.baseUrl;

export type BlogRaw = {
  id?: string | number;
  blogId?: string | number;
  _id?: string | number;
  category?: string;
  title?: string;
  slug?: string;
  metaTitle?: string;
  keyphrase?: string | string[];
  publisherName?: string;
  description?: string;
  keywords?: string | string[];
  keyword?: string | string[];
  tags?: string | string[];
  publishedOnMillis?:
    | number
    | string
    | {
        seconds?: number | string;
        _seconds?: number | string;
        sec?: number | string;
        nanos?: number | string;
        _nanoseconds?: number | string;
      };
  publishedOn?:
    | string
    | number
    | {
        seconds?: number | string;
        _seconds?: number | string;
        sec?: number | string;
        nanos?: number | string;
        _nanoseconds?: number | string;
      };
  /** Firestore Timestamp on the backend Blog model; serialized like publishedOn. */
  updatedAt?: BlogRaw["publishedOn"];
  updatedAtMillis?: BlogRaw["publishedOnMillis"];
  photoUrl?: string | { url?: string; secure_url?: string; imageUrl?: string };
  imageUrl?: string | { url?: string; secure_url?: string; imageUrl?: string };
  photo?: string | { url?: string; secure_url?: string; imageUrl?: string };
  thumbnailUrl?: string | { url?: string; secure_url?: string; imageUrl?: string };
  bannerUrl?: string;
  bannerImageUrl?: string;
  blogImageUrl?: string;
  coverImageUrl?: string;
};

export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  author: string;
  publishedOn: string;
  tag: string;
  imageUrl: string;
  readTime: string;
  description: string;
  category: string;
  keywords: string[];
  keyphrase: string[];
  publishedOnMillis?: number;
  /** Last edit time, when the API sends one. Drives BlogPosting.dateModified. */
  updatedAtMillis?: number;
};

export type BlogCreatePayload = {
  category: string;
  title: string;
  publisherName: string;
  description: string;
  publishedOnMillis: number;
};

export type BlogUpdatePayload = Partial<Pick<BlogCreatePayload, "title" | "description" | "publishedOnMillis">> & {
  category?: string;
  publisherName?: string;
};

export type BlogMutationResponse = {
  success?: boolean;
  status?: string;
  id?: string | number;
  message?: string;
  [key: string]: unknown;
};

function getId(raw: BlogRaw): string {
  const v = raw.id ?? raw.blogId ?? raw._id;
  if (v === undefined || v === null) return "";
  return String(v);
}

export function resolveBlogImageUrl(url?: string | null): string {
  if (!url || !String(url).trim()) return "";
  const s = String(url).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (!baseUrl) return s.startsWith("/") ? s : `/${s}`;
  const path = s.startsWith("/") ? s : `/${s}`;
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return `${baseUrl}${path}`;
  }
}

function pickString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readMediaField(value: unknown): string | undefined {
  if (typeof value === "string") {
    const v = value.trim();
    return v || undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  return pickString(v.url, v.secure_url, v.imageUrl);
}

function resolveBlogRawImage(raw: BlogRaw): string | undefined {
  return pickString(
    readMediaField(raw.photoUrl),
    readMediaField(raw.imageUrl),
    readMediaField(raw.photo),
    readMediaField(raw.thumbnailUrl),
    raw.bannerImageUrl,
    raw.blogImageUrl,
    raw.coverImageUrl,
    raw.bannerUrl
  );
}

export function formatPublishedLine(millis?: number): string {
  if (millis == null || Number.isNaN(Number(millis))) return "Published on: —";
  const d = new Date(millis);
  return `Published on: ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}`;
}

export function formatPublishedHeading(millis?: number): string {
  if (millis == null || Number.isNaN(Number(millis))) return "—";
  const d = new Date(millis);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPublishedLineFlexible(raw: BlogRaw): string {
  if (raw.publishedOn && typeof raw.publishedOn === "string") {
    const s = raw.publishedOn.trim();
    if (s.toLowerCase().startsWith("published")) return s;
    // Backend sometimes returns a raw date string; keep UI stable.
    return `Published on: ${s}`;
  }
  return formatPublishedLine(resolvePublishedOnMillis(raw));
}

function toEpochMillis(
  value: BlogRaw["publishedOnMillis"] | BlogRaw["publishedOn"]
): number | undefined {
  if (value == null) return undefined;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    // Heuristic: values below 1e12 are usually epoch seconds.
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n < 1_000_000_000_000 ? n * 1000 : n;
    const fromDate = new Date(value).getTime();
    return Number.isNaN(fromDate) ? undefined : fromDate;
  }

  if (typeof value === "object") {
    const sec = Number(value.seconds ?? value._seconds ?? value.sec ?? 0);
    const nanos = Number(value.nanos ?? value._nanoseconds ?? 0);
    if (!Number.isFinite(sec) || !Number.isFinite(nanos)) return undefined;
    return sec * 1000 + Math.floor(nanos / 1_000_000);
  }

  return undefined;
}

function resolvePublishedOnMillis(raw: BlogRaw): number | undefined {
  return toEpochMillis(raw.publishedOnMillis) ?? toEpochMillis(raw.publishedOn);
}

// Editors have pasted absolute URLs into the relative-link field, producing
// href="/https://procounsel.co.in/..." — broken for readers, and the prerender
// crawler followed it into a bogus /https:/... route.
function sanitizeBlogBody(html?: string): string {
  return (html ?? "").trim().replace(/(href|src)=(["'])\/(https?:\/\/)/gi, "$1=$2$3");
}

function estimateReadTime(description?: string): string {
  if (!description?.trim()) return "Article";
  const words = description.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

function parseKeywords(raw: BlogRaw): string[] {
  const sources: unknown[] = [raw.keywords, raw.keyword, raw.tags, raw.keyphrase];
  const values: string[] = [];

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (typeof item === "string") values.push(item);
      }
      continue;
    }

    if (typeof source === "string") {
      values.push(...source.split(","));
    }
  }

  const dedup = new Set<string>();
  for (const entry of values) {
    const value = entry.trim();
    if (!value) continue;
    dedup.add(value);
  }
  return Array.from(dedup);
}

function normalizeSlugValue(raw: BlogRaw, title: string, id: string): string {
  const source = (raw.slug ?? "").trim();
  const base = source || title || id;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseListPayload(json: unknown): BlogRaw[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as BlogRaw[];
  if (typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const keys = ["data", "blogs", "items", "content", "result", "payload"] as const;
  for (const k of keys) {
    const c = o[k];
    if (Array.isArray(c)) return c as BlogRaw[];
  }
  return [];
}

function extractDetailRaw(json: unknown): BlogRaw | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.data !== undefined && typeof o.data === "object" && o.data !== null && !Array.isArray(o.data)) {
    return o.data as BlogRaw;
  }
  return json as BlogRaw;
}

export function normalizeBlog(raw: BlogRaw, fallbackId?: string): BlogListItem | null {
  const id = getId(raw) || (fallbackId ?? "");
  if (!id) return null;
  const title = raw.title?.trim() || "Untitled";
  const metaTitle = raw.metaTitle?.trim() || title;
  const author = raw.publisherName?.trim() || "—";
  const category = raw.category?.trim() || "General";
  const tag = category.replace(/_/g, " ");
  const publishedOnMillis = resolvePublishedOnMillis(raw);
  const updatedAtMillis = toEpochMillis(raw.updatedAtMillis) ?? toEpochMillis(raw.updatedAt);
  const keywords = parseKeywords(raw);
  const keyphrase = typeof raw.keyphrase === "string"
    ? raw.keyphrase.split(",").map((item) => item.trim()).filter(Boolean)
    : Array.isArray(raw.keyphrase)
      ? raw.keyphrase.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];
  const slug = normalizeSlugValue(raw, title, id);

  return {
    id,
    slug,
    title,
    metaTitle,
    author,
    publishedOn: formatPublishedLineFlexible(raw),
    tag,
    imageUrl: resolveBlogImageUrl(resolveBlogRawImage(raw)),
    readTime: estimateReadTime(raw.description),
    description: sanitizeBlogBody(raw.description),
    category,
    keywords,
    keyphrase,
    publishedOnMillis,
    ...(updatedAtMillis != null ? { updatedAtMillis } : {}),
  };
}

function writeHeaders(): HeadersInit {
  return { Accept: "application/json" };
}

function ensureMutationSuccess(data: BlogMutationResponse, fallbackMessage: string) {
  const success = data.success;
  const status = data.status;
  const message = data.message;

  const looksOk =
    success === true ||
    (typeof status === "string" && status.toLowerCase() === "success") ||
    typeof data.id !== "undefined";

  if (!looksOk) {
    throw new Error(message || fallbackMessage);
  }
}

export async function createBlog(
  blogData: BlogCreatePayload,
  photo?: File | null
): Promise<BlogMutationResponse> {
  const formData = new FormData();
  formData.append("blogData", JSON.stringify(blogData));
  if (photo) formData.append("photo", photo);

  const res = await fetch(`${baseUrl}/api/blogs`, {
    method: "POST",
    headers: writeHeaders(),
    body: formData,
  });

  const json: BlogMutationResponse = await res.json().catch(() => ({} as BlogMutationResponse));
  if (!res.ok) throw new Error(json.message || `Failed to create blog (${res.status})`);

  ensureMutationSuccess(json, "Failed to create blog");
  return json;
}

export async function updateBlog(
  blogId: string,
  blogData: BlogUpdatePayload,
  photo?: File | null
): Promise<BlogMutationResponse> {
  const formData = new FormData();
  formData.append("blogData", JSON.stringify(blogData ?? {}));
  if (photo) formData.append("photo", photo);

  const res = await fetch(`${baseUrl}/api/blogs/${encodeURIComponent(blogId)}`, {
    method: "PUT",
    headers: writeHeaders(),
    body: formData,
  });

  const json: BlogMutationResponse = await res.json().catch(() => ({} as BlogMutationResponse));
  if (!res.ok) throw new Error(json.message || `Failed to update blog (${res.status})`);

  ensureMutationSuccess(json, "Failed to update blog");
  return json;
}

export async function deleteBlog(blogId: string): Promise<BlogMutationResponse> {
  const res = await fetch(`${baseUrl}/api/blogs/${encodeURIComponent(blogId)}`, {
    method: "DELETE",
    headers: writeHeaders(),
  });

  if (res.status === 204) {
    return { success: true };
  }

  const json: BlogMutationResponse = await res.json().catch(() => ({} as BlogMutationResponse));
  if (!res.ok) throw new Error(json.message || `Failed to delete blog (${res.status})`);

  if (Object.keys(json).length === 0) {
    return { success: true };
  }

  ensureMutationSuccess(json, "Failed to delete blog");
  return json;
}

export async function fetchBlogsList(): Promise<BlogListItem[]> {
  if (!baseUrl) {
    console.warn("VITE_API_BASE_URL is not set; blog requests will fail.");
  }
  const res = await fetch(`${baseUrl}/api/blogs/list`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to load blogs (${res.status})`);
  }
  const json: unknown = await res.json();
  const rows = parseListPayload(json);
  return rows
    .map((r) => normalizeBlog(r))
    .filter((b): b is BlogListItem => b !== null);
}

export async function fetchBlogById(id: string): Promise<BlogListItem | null> {
  const res = await fetch(`${baseUrl}/api/blogs/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load blog (${res.status})`);
  }
  const json: unknown = await res.json();
  const raw = extractDetailRaw(json);
  if (!raw) return null;
  return normalizeBlog(raw, id);
}
