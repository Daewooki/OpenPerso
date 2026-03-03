import type { Metadata } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/v1/personas/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    const persona = await res.json();
    const description =
      persona.tagline || persona.description?.slice(0, 160) || `${persona.name}와 대화하세요`;

    return {
      title: `${persona.name} - OpenPerso`,
      description,
      openGraph: {
        title: `${persona.name} - OpenPerso`,
        description,
        type: "profile",
      },
      twitter: {
        card: "summary",
        title: `${persona.name} - OpenPerso`,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default function PersonaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
