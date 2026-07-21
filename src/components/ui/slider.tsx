"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full h-1 w-full"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full w-full"
          style={{ backgroundColor: '#E5231B' }}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-3.5 shrink-0 rounded-full border-2 cursor-grab active:cursor-grabbing focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          style={{ borderColor: '#E5231B', backgroundColor: '#0A0A0A' }}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
