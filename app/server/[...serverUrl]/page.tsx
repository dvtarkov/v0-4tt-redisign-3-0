import { ServerDetails } from "@/components/server/server-details"

interface DetailedServerPageProps {
  params: {
    serverUrl: string[]
  }
}

export default function DetailedServerPage({ params }: DetailedServerPageProps) {
  const serverUrl = params.serverUrl.join("/")

  return <ServerDetails serverUrl={serverUrl} />
}
