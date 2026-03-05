import { ConfigureConnectionPage } from "@/components/connection/ConfigureConnectionPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConfigureConnectionPage connectionId={id} />;
}
