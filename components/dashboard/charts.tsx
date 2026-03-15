"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

const COLORS = [
  "oklch(0.65 0.15 160)",
  "oklch(0.7 0.15 230)",
  "oklch(0.75 0.15 60)",
  "oklch(0.6 0.15 300)",
  "oklch(0.65 0.2 25)",
]

export function DeliveriesChart() {
  const { closings } = useData()

  const data = closings.slice(-5).map((c) => ({
    name: c.driverName.split(" ")[0],
    entregas: c.deliveries.completed,
    canceladas: c.deliveries.canceled,
  }))

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Entregas por Motorista</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
            <XAxis dataKey="name" stroke="oklch(0.65 0 0)" fontSize={12} />
            <YAxis stroke="oklch(0.65 0 0)" fontSize={12} />
            <Tooltip
              cursor={{ fill: "rgba(156, 163, 175, 0.15)" }}
              contentStyle={{
                backgroundColor: "oklch(0.17 0.005 260)",
                border: "1px solid oklch(0.28 0.005 260)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "oklch(0.95 0 0)" }}
            />
            <Legend />
            <Bar dataKey="entregas" fill="oklch(0.65 0.15 160)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="canceladas" fill="oklch(0.55 0.2 25)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function FinancialChart() {
  const { closings } = useData()

  const data = closings.slice(-5).map((c) => ({
    name: c.driverName.split(" ")[0],
    bruto: c.financial.grossValue,
    liquido: c.financial.netValue,
  }))

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Valores Financeiros</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
            <XAxis dataKey="name" stroke="oklch(0.65 0 0)" fontSize={12} />
            <YAxis stroke="oklch(0.65 0 0)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.17 0.005 260)",
                border: "1px solid oklch(0.28 0.005 260)",
                borderRadius: "8px",
              }}
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="bruto"
              stroke="oklch(0.7 0.15 230)"
              strokeWidth={2}
              dot={{ fill: "oklch(0.7 0.15 230)" }}
            />
            <Line
              type="monotone"
              dataKey="liquido"
              stroke="oklch(0.65 0.15 160)"
              strokeWidth={2}
              dot={{ fill: "oklch(0.65 0.15 160)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function StatusDonutChart() {
  const { closings } = useData()

  const data = [
    { name: "Pendente", value: closings.filter((c) => c.status === "pending").length, color: "oklch(0.75 0.15 60)" },
    { name: "Aprovado", value: closings.filter((c) => c.status === "approved").length, color: "oklch(0.65 0.15 160)" },
    { name: "Pago", value: closings.filter((c) => c.status === "paid").length, color: "oklch(0.7 0.15 230)" },
  ].filter((d) => d.value > 0)

  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Fechamentos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            {/* Texto no centro */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
              {total}
            </text>
            <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
              Total
            </text>
          </PieChart>
        </ResponsiveContainer>

        {/* Legenda externa em grid */}
        <div className="grid grid-cols-3 gap-4 w-full mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-lg font-bold">{item.value}</span>
              <span className="text-xs text-muted-foreground">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function HoursChart() {
  const { closings } = useData()

  const data = closings.slice(-5).map((c) => ({
    name: c.driverName.split(" ")[0],
    regular: c.hours.regular,
    extra: c.hours.overtime,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas Trabalhadas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.005 260)" />
            <XAxis type="number" stroke="oklch(0.65 0 0)" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="oklch(0.65 0 0)" fontSize={12} width={60} />
            <Tooltip
              cursor={{ fill: "rgba(156, 163, 175, 0.15)" }}
              contentStyle={{
                backgroundColor: "oklch(0.17 0.005 260)",
                border: "1px solid oklch(0.28 0.005 260)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="regular" stackId="a" fill="oklch(0.65 0.15 160)" />
            <Bar dataKey="extra" stackId="a" fill="oklch(0.75 0.15 60)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
