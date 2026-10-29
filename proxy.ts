import { NextResponse } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/chat(.*)"]);
const isSessionApi = createRouteMatcher([
  "/api/chat",
  "/api/chat/",
  "/api/translate",
  "/api/translate/",
  "/api/export",
  "/api/export/",
]);

export default convexAuthNextjsMiddleware(async (request, ctx) => {
  const isAuth = await ctx.convexAuth.isAuthenticated();

  // /api/auth is proxied by convexAuthNextjsMiddleware before this handler.
  if (isSessionApi(request) && request.method === "POST" && !isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isSignInPage(request) && isAuth) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  if (isProtectedRoute(request) && !isAuth) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
