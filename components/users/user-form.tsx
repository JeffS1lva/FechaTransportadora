"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function UserForm() {
  const { addUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("viewer")
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setRole("viewer")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Por favor, preencha todos os campos.")
      return
    }

    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 300))

    const success = addUser({ name: name.trim(), email: email.trim().toLowerCase(), password, role })
    if (!success) {
      toast.error("Já existe um usuário com esse email.")
      setIsSaving(false)
      return
    }

    toast.success("Usuário criado com sucesso.")
    resetForm()
    setOpen(false)
    setIsSaving(false)
  }

  

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value)
      if (!value) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2 h-9 w-full sm:h-10 text-xs sm:text-sm">
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Adicionar usuário</span>
          <span className="sm:hidden ">Adicionar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg">Adicionar usuário</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Crie um novo usuário com permissões de visualização ou edição.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-2">
          <div className="grid gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome do usuário"
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha"
                required
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium">Permissão</label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer" className="text-sm">Visualizador</SelectItem>
                  <SelectItem value="editor" className="text-sm">Editor</SelectItem>
                  <SelectItem value="admin" className="text-sm">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}