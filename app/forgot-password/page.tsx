import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Header } from "@/components/layout/header"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ForgotPasswordForm />
    </div>
  )
}
