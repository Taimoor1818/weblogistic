import { NextResponse } from "next/server";

export function middleware() {
    // In a real production app, you would verify the session cookie here
    // For this implementation, we're handling auth checks mainly on the client side
    // via the useAuth hook and AdminGuard component.
    // However, we can add some basic route protection here if needed.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
