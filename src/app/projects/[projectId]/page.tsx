import React from "react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  return <div>Project is {projectId}</div>;
}
