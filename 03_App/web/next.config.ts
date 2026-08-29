import type { NextConfig } from "next";

/**
 * The canonical host is the apex, `sikhchampionships.com`.
 *
 * Both hosts served the site, which is duplicate content: search engines have to guess
 * which is authoritative, links and social shares split between the two, and anything
 * host-scoped (cookies, analytics, an eventual login session) silently forks in half.
 * Pick one and mean it.
 *
 * Apex over www because this name goes on posters, flyers and social bios for a community
 * event — the shortest thing a person can be told to type wins. Cloudflare handles apex
 * records fine, so the old technical argument for www does not apply here.
 *
 * Done in config rather than a Cloudflare Redirect Rule so it is version-controlled and
 * reviewable, instead of dashboard state nobody remembers setting.
 */
const CANONICAL_HOST = "sikhchampionships.com";

const nextConfig: NextConfig = {
  async redirects() {
    const fromWww = [{ type: "host" as const, value: `www.${CANONICAL_HOST}` }];
    return [
      // The root needs its own rule. When `/:path*` matches `/`, the parameter is empty
      // and Next emits the literal ":path*" in the destination — so www.sikhchampionships.com
      // redirected to `https://sikhchampionships.com/:path*`. Caught by testing the bare
      // root as well as a sub-path; only the root was broken.
      {
        source: "/",
        has: fromWww,
        destination: `https://${CANONICAL_HOST}/`,
        permanent: true, // 301 — tells search engines the apex is the real one.
      },
      {
        source: "/:path+",
        has: fromWww,
        destination: `https://${CANONICAL_HOST}/:path+`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
