// The standalone Node worker is a trusted server process. Its dedicated
// esbuild target aliases React's compile-time `server-only` marker here while
// the normal Next.js build keeps enforcing the original marker.
export {};
