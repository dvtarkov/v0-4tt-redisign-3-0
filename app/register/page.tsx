import { RegisterForm } from "@/components/auth/register-form"
import { Header } from "@/components/layout/header"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
