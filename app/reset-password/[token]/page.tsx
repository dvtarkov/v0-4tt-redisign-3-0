import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Header } from "@/components/layout/header"

export const metadata = {
  title: "Сброс пароля - 4TT",
  description: "Сброс пароля для вашего аккаунта 4TT",
}

interface ResetPasswordPageProps {
  params: {
    token: string
  }
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  console.log("[v0] Reset password page loaded with token:", params.token)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ResetPasswordForm token={params.token} />
    </div>
  )
}
