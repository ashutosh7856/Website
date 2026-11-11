/** Types for siteUrl.mjs (plain JS so the Node build scripts can import it too). */
export declare const SITE_ORIGIN: string;
export declare function canonicalPath(input?: string): string;
export declare function absoluteUrl(path?: string, origin?: string): string;
export declare function stripTrailingSlash(path: string): string;
