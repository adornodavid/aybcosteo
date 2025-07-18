"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const lineData = [
  { name: "Ene", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Abr", uv: 2780, pv: 3908, amt: 2000 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100 },
]

const barData = [
  { name: "Categoría A", value: 400 },
  { name: "Categoría B", value: 300 },
  { name: "Categoría C", value: 200 },
  { name: "Categoría D", value: 278 },
  { name: "Categoría E", value: 189 },
]

export default function TestChartPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Recharts Test Page</h1>

      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Line Chart Example</CardTitle>
          <CardDescription>A simple line chart to test Recharts rendering.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full border border-gray-300 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} width={500} height={300}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Bar Chart Example</CardTitle>
          <CardDescription>A simple bar chart to test Recharts rendering.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full border border-gray-300 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} width={100} height={100}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
