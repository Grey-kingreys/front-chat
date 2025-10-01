import { type RouteConfig, route,  index } from "@react-router/dev/routes";




export default [index("routes/home.tsx"), route("/register", "routes/register.tsx"), route("/logout", "routes/logout.tsx")] satisfies RouteConfig;
