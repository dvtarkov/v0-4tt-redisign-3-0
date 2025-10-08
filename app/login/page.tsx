import { LoginForm } from "@/components/auth/login-form"
import { Header } from "@/components/layout/header"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <LoginForm />
    </div>
  )
}
