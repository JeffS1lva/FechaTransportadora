"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { 
  Truck, 
  AlertCircle, 
  UserPlus, 
  Calculator, 
  Users, 
  Shield,
  LayoutDashboard
} from "lucide-react"

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 500))

    const success = login(email, password)
    if (!success) {
      setError("Email ou senha incorretos")
    }
    setIsLoading(false)
  }

  const features = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Cadastro de Motoristas",
      description: "Gerencie o cadastro completo de motoristas com dados pessoais e documentação"
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "Fechamento de Motoristas",
      description: "Realize fechamentos mensais com cálculos automáticos de valores e descontos"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Controle por Colaborador",
      description: "Gerencie permissões e acessos de cada colaborador da plataforma"
    },
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      title: "Dashboard",
      description: "Visualize indicadores e acompanhe a performance das operações"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Segurança",
      description: "Proteção de dados com autenticação segura e controle de acesso"
    }
  ]

  return (
    <div className="min-h-screen flex bg-white">
      {/* Lado Esquerdo - Informações (mais da metade da tela) */}
      <div className="hidden lg:flex lg:w-[60%] xl:w-[65%] bg-linear-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white flex-col justify-between p-8 xl:p-16 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fechamento de Motoristas</h1>
            <p className="text-emerald-100 text-sm">Sistema de Gestão Logística</p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Gerencie seus fechamentos com{" "}
              <span className="text-emerald-200">eficiência</span> e{" "}
              <span className="text-emerald-200">precisão</span>
            </h2>
            <p className="text-lg text-emerald-100 mb-12 leading-relaxed">
              Plataforma completa para gestão de motoristas, oferecendo cadastro, 
              fechamentos automatizados e controle de acesso por colaborador.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  <div className="shrink-0 p-2 rounded-lg bg-emerald-500/30">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-emerald-100 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-emerald-200">
          <p>© 2024 Fechamento de Motoristas. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Lado Direito - Login */}
      <div className="flex-1 lg:w-[40%] xl:w-[35%] flex items-center justify-center bg-gray-50 p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white">
          <CardHeader className="text-center space-y-4">
            {/* Logo Mobile (visível apenas em telas pequenas) */}
            <div className="lg:hidden mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Truck className="h-7 w-7 text-emerald-600" />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="text-gray-500">
                Acesse sua conta para gerenciar fechamentos
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel className="text-gray-700 font-medium">Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-gray-200 text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-gray-700 font-medium">Senha</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 border-gray-200 text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </Field>
              </FieldGroup>

              <div className="flex items-center text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  Lembrar-me
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar no Sistema"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Credenciais de teste</span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm border border-gray-100">
              <p className="font-semibold text-gray-700 mb-3">Acesso de demonstração:</p>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="font-medium text-gray-700">Admin</span>
                  <span className="text-xs text-gray-500">admin@empresa.com / admin123</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="font-medium text-gray-700">Editor</span>
                  <span className="text-xs text-gray-500">editor@empresa.com / editor123</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                  <span className="font-medium text-gray-700">Visualizador</span>
                  <span className="text-xs text-gray-500">visualizador@empresa.com / view123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}