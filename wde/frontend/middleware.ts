import { NextRequest, NextResponse } from "next/server";
const PUBLIC_PATHS = ["/", "/login", "/_next", "/favicon.ico"];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return NextResponse.next();
  const session = request.cookies.get("wde_session")?.value;
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api).*)"] };
