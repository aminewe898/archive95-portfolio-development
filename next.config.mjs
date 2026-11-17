// Two ways to ship the site:
// - `pnpm build` + `pnpm start`: a Node server that also sends the security headers below.
// - `STATIC_EXPORT=1 pnpm build`: plain files in `out/` for static hosts such as GitHub Pages.
//   Static hosts cannot send custom headers, so those are only configured for the server build.
//   Set NEXT_PUBLIC_BASE_PATH when the site lives under a sub-path (GitHub Pages: /<repository>).
const staticExport = process.env.STATIC_EXPORT === '1'
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = staticExport
  ? {
      output: 'export',
      basePath,
      // Emit `en/index.html` rather than `en.html`, which static hosts serve for both /en and /en/.
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      async headers() {
        return [{ source: '/:path*', headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ] }]
      },
    }

export default nextConfig
