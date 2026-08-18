import { GenerationDetail } from "@/components/GenerationDetail";

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GenerationDetail id={id} />;
}
