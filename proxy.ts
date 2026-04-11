import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/chat(.*)"]);

export default convexAuthNextjsMiddleware(async (request, ctx) => {
  const isAuth = await ctx.convexAuth.isAuthenticated();

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
