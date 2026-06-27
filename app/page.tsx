import { redirect } from "next/navigation";

// Middleware already handles "/" redirection based on auth; this is a fallback.
export default function Home() {
  redirect("/leads");
}
