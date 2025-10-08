import { EmailConfirmationForm } from "@/components/auth/email-confirmation-form"
import { Header } from "@/components/layout/header"

export const metadata = {
  title: "Подтверждение email - 4TT",
  description: "Подтверждение email адреса для вашего аккаунта 4TT",
}

interface EmailConfirmationPageProps {
  params: {
    token: string
  }
}

export default function EmailConfirmationPage({ params }: EmailConfirmationPageProps) {
  console.log("[v0] Email confirmation page loaded with token:", params.token)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <EmailConfirmationForm token={params.token} />
    </div>
  )
}
