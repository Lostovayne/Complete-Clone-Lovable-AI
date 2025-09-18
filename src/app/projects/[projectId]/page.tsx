import { getQueryClient, trpc } from "@/trpc/server";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({ projectId }));

  return <div>Project is {projectId}</div>;
}
