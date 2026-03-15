export function onlyDigits(value: string) {
  return value.replace(/\D+/g, "")
}

export function isValidCPF(cpf: string) {
  const clean = onlyDigits(cpf).padStart(11, "0").slice(0, 11)
  if (!clean || clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  const calcDigit = (digits: string, factor: number) => {
    const total = digits
      .split("")
      .reduce((sum, digit) => sum + Number(digit) * factor--, 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const digit1 = calcDigit(clean.slice(0, 9), 10)
  const digit2 = calcDigit(clean.slice(0, 10), 11)

  return digit1 === Number(clean[9]) && digit2 === Number(clean[10])
}

export function isValidCNH(cnh: string) {
  const clean = onlyDigits(cnh)
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  const digits = clean.split("").map(Number)

  const calcCheckDigit = (base: number[], factorStart: number) => {
    const total = base.reduce((sum, digit, idx) => sum + digit * (factorStart - idx), 0)
    const remainder = total % 11
    return remainder >= 10 ? 0 : remainder
  }

  const first = calcCheckDigit(digits.slice(0, 9), 9)
  const second = calcCheckDigit([...digits.slice(0, 9), first], 1)

  return first === digits[9] && second === digits[10]
}

export type ViaCepResponse = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchViaCEP(cep: string) {
  const clean = onlyDigits(cep)
  if (clean.length !== 8) {
    throw new Error("CEP inválido")
  }

  const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP")
  }

  const data = (await response.json()) as ViaCepResponse
  if (data.erro) {
    throw new Error("CEP não encontrado")
  }

  return data
}
