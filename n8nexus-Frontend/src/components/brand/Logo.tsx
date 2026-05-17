import { Link } from "@tanstack/react-router";

const LOGO_SRC = "/logo.png";
const LOGO_ALT =
  "N8NEXUS — AUTOMATE. CONNECT. ELEVATE.";

export function Logo({ withText = true, to = "/" }: { withText?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center group shrink-0">
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT}
        className={
          withText
            ? "block h-9 sm:h-10 w-auto max-w-[min(100%,200px)] sm:max-w-[220px] object-contain object-left transition-opacity group-hover:opacity-90"
            : "h-9 w-9 shrink-0 object-cover object-left object-[0%_50%] transition-opacity group-hover:opacity-90"
        }
      />
    </Link>
  );
}
