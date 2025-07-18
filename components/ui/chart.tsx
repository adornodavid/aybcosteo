"use client"

import * as React from "react"
import {
  VictoryPie,
  VictoryChart,
  VictoryAxis,
  VictoryBar,
  VictoryLine,
  VictoryArea,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
  VictoryLegend,
} from "victory"

import { cn } from "@/lib/utils"

const ChartContext = React.createContext<any>({})

function Chart({ className, children, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()
  return (
    <ChartContext.Provider value={{ id }}>
      <div data-chart={id} className={cn("flex aspect-video justify-center text-foreground", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

const ChartContainer = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof VictoryChart>>(
  ({ className, children, ...props }, ref) => {
    const { id } = React.useContext(ChartContext)
    return (
      <div data-chart-container={id} className={cn("flex w-full flex-col", className)} ref={ref}>
        <VictoryChart theme={VictoryTheme.material} {...props}>
          {children}
        </VictoryChart>
      </div>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<any, React.ComponentProps<typeof VictoryTooltip>>(
  ({ className, ...props }, ref) => {
    return (
      <VictoryTooltip
        ref={ref}
        flyoutStyle={{
          fill: "hsl(var(--background))",
          stroke: "hsl(var(--border))",
          strokeWidth: 1,
        }}
        style={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
        {...props}
      />
    )
  },
)
ChartTooltip.displayName = "ChartTooltip"

const ChartLegend = React.forwardRef<any, React.ComponentProps<typeof VictoryLegend>>(
  ({ className, ...props }, ref) => {
    return (
      <VictoryLegend
        ref={ref}
        orientation="horizontal"
        gutter={20}
        style={{ labels: { fontSize: 10, fill: "hsl(var(--foreground))" } }}
        {...props}
      />
    )
  },
)
ChartLegend.displayName = "ChartLegend"

const ChartAxis = React.forwardRef<any, React.ComponentProps<typeof VictoryAxis>>(({ className, ...props }, ref) => {
  return (
    <VictoryAxis
      ref={ref}
      style={{
        axis: { stroke: "hsl(var(--border))" },
        tickLabels: { fill: "hsl(var(--muted-foreground))", fontSize: 9 },
        grid: { stroke: "hsl(var(--muted))", strokeDasharray: "4 4" },
      }}
      {...props}
    />
  )
})
ChartAxis.displayName = "ChartAxis"

const ChartBar = React.forwardRef<any, React.ComponentProps<typeof VictoryBar>>(({ className, ...props }, ref) => {
  return (
    <VictoryBar
      ref={ref}
      labels={({ datum }) => datum.y}
      labelComponent={<ChartTooltip />}
      style={{ data: { fill: "hsl(var(--primary))" } }}
      {...props}
    />
  )
})
ChartBar.displayName = "ChartBar"

const ChartLine = React.forwardRef<any, React.ComponentProps<typeof VictoryLine>>(({ className, ...props }, ref) => {
  return (
    <VictoryLine
      ref={ref}
      labels={({ datum }) => datum.y}
      labelComponent={<ChartTooltip />}
      style={{ data: { stroke: "hsl(var(--primary))" } }}
      {...props}
    />
  )
})
ChartLine.displayName = "ChartLine"

const ChartArea = React.forwardRef<any, React.ComponentProps<typeof VictoryArea>>(({ className, ...props }, ref) => {
  return (
    <VictoryArea
      ref={ref}
      labels={({ datum }) => datum.y}
      labelComponent={<ChartTooltip />}
      style={{ data: { fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))" } }}
      {...props}
    />
  )
})
ChartArea.displayName = "ChartArea"

const ChartScatter = React.forwardRef<any, React.ComponentProps<typeof VictoryScatter>>(
  ({ className, ...props }, ref) => {
    return (
      <VictoryScatter
        ref={ref}
        labels={({ datum }) => datum.y}
        labelComponent={<ChartTooltip />}
        style={{ data: { fill: "hsl(var(--primary))" } }}
        {...props}
      />
    )
  },
)
ChartScatter.displayName = "ChartScatter"

const ChartPie = React.forwardRef<any, React.ComponentProps<typeof VictoryPie>>(({ className, ...props }, ref) => {
  return (
    <VictoryPie
      ref={ref}
      labels={({ datum }) => datum.x}
      labelComponent={<ChartTooltip />}
      colorScale="qualitative"
      style={{ labels: { fill: "hsl(var(--foreground))", fontSize: 10 } }}
      {...props}
    />
  )
})
ChartPie.displayName = "ChartPie"

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartAxis,
  ChartBar,
  ChartLine,
  ChartArea,
  ChartScatter,
  ChartPie,
}
