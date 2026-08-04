import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TutorialsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  redirect(`/writing?category=tutorials${page ? `&page=${encodeURIComponent(page)}` : ""}`);
}
