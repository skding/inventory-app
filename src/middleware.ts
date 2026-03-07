import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/",
        "/inventory/:path*",
        "/projects/:path*",
        "/transactions/:path*",
    ],
};
