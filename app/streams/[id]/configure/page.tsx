import { ConfigureStreamPage } from "@/components/stream/ConfigureStreamPage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConfigureStreamPage streamId={id} />;
}
