
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPickerSingleProps } from "react-day-picker" // Import DayPickerSingleProps

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar" // This is essentially DayPicker
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Use DayPickerSingleProps for a more specific type for single mode
// Omit props that we are explicitly managing or that are fixed by 'mode="single"'
interface DatePickerProps extends Omit<DayPickerSingleProps, 'onSelect' | 'selected' | 'mode'> {
  selected?: Date;
  onSelect: (date?: Date) => void; // This is the simplified onSelect for form usage
}

export function DatePicker({ selected, onSelect, className, ...props }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single" // Explicitly set mode to single
          selected={selected}
          // Adapt the react-day-picker onSelect to our simpler onSelect prop
          onSelect={(day, _selectedDay, _activeModifiers, _e) => onSelect(day)}
          initialFocus
          className={cn("p-3 pointer-events-auto", className)}
          {...props} // Spread remaining DayPickerSingleProps
        />
      </PopoverContent>
    </Popover>
  )
}

