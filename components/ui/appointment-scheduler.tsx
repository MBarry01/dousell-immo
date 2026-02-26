"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock, Globe, Video, Check, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimeSlot {
  time: string
  available: boolean
}

interface AvailableDate {
  date: number
  hasSlots: boolean
}

export interface AppointmentSchedulerProps {
  userName: string
  userAvatar?: string
  meetingTitle: string
  meetingType: string
  duration: string
  timezone: string
  availableDates: AvailableDate[]
  timeSlots: TimeSlot[]
  onDateSelect?: (date: number) => void
  onTimeSelect?: (time: string) => void
  onConfirm?: (data: { date: Date; time: string; month: number; year: number }) => Promise<void>
  isSubmitting?: boolean
  brandName?: string
}

export function AppointmentScheduler({
  userName,
  userAvatar,
  meetingTitle,
  meetingType,
  duration,
  timezone,
  availableDates,
  timeSlots,
  onDateSelect,
  onTimeSelect,
  onConfirm,
  isSubmitting = false,
  brandName = "Dousel Agenda",
}: AppointmentSchedulerProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h")

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ]

  const dayNames = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateClick = (date: number) => {
    const isAvailable = availableDates.find((d) => d.date === date && d.hasSlots)
    if (isAvailable) {
      setSelectedDate(date)
      setSelectedTime(null)
      onDateSelect?.(date)
    }
  }

  const handleTimeClick = (time: string) => {
    setSelectedTime(time)
    onTimeSelect?.(time)
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !onConfirm) return

    const appointmentDate = new Date(currentYear, currentMonth, selectedDate)
    await onConfirm({
      date: appointmentDate,
      time: selectedTime,
      month: currentMonth + 1,
      year: currentYear,
    })
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  const getSelectedDayName = () => {
    if (!selectedDate) return ""
    const date = new Date(currentYear, currentMonth, selectedDate)
    return date.toLocaleDateString("fr-FR", { weekday: "long" })
  }

  const getSelectedDateFormatted = () => {
    if (!selectedDate) return ""
    const date = new Date(currentYear, currentMonth, selectedDate)
    return date.toLocaleDateString("fr-FR", { month: "long", day: "numeric", year: "numeric" })
  }

  const formatTime = (time: string) => {
    if (timeFormat === "24h") return time

    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const canConfirm = selectedDate && selectedTime && onConfirm

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-5xl gap-0 rounded-[32px] border border-[#F4C430]/20 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Left Panel - Meeting Info */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#F4C430]/10 bg-black/40 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-[#F4C430]/30 bg-black">
            <AvatarImage src={userAvatar || "/icons/icon-192.png"} alt={userName} className="object-contain p-1" />
            <AvatarFallback className="bg-[#F4C430]/20 text-[#F4C430]">
              {userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-white/70">{userName}</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">{meetingTitle}</h2>

          <div className="space-y-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#F4C430]" />
              <span>{meetingType}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#F4C430]" />
              <span>{duration}</span>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#F4C430]" />
              <span>{timezone}</span>
            </div>
          </div>
        </div>

        {/* Résumé de la sélection */}
        {selectedDate && selectedTime && (
          <div className="p-4 rounded-xl bg-[#F4C430]/10 border border-[#F4C430]/20 space-y-2">
            <p className="text-xs uppercase tracking-wider text-[#F4C430]/70">Votre rendez-vous</p>
            <p className="text-white font-medium capitalize">{getSelectedDayName()}</p>
            <p className="text-white/80 text-sm">{getSelectedDateFormatted()}</p>
            <p className="text-[#F4C430] font-semibold">{formatTime(selectedTime)}</p>
          </div>
        )}
      </div>

      {/* Center Panel - Calendar */}
      <div className="flex-1 p-4 md:p-6">
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              {monthNames[currentMonth]}{" "}
              <span className="text-white/50">{currentYear}</span>
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-[#F4C430] hover:bg-[#F4C430]/10"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-[#F4C430] hover:bg-[#F4C430]/10"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-medium text-white/40 py-2 min-w-[32px]"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />
              }

              const isAvailable = availableDates.find(
                (d) => d.date === day && d.hasSlots
              )
              const isSelected = day === selectedDate
              const hasIndicator = isAvailable && !isSelected

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative h-12 rounded-xl text-sm font-medium transition-all duration-200",
                    "hover:scale-105 active:scale-95",
                    isSelected &&
                    "bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/30 scale-105",
                    !isSelected &&
                    isAvailable &&
                    "bg-white/5 text-white hover:bg-[#F4C430]/20 hover:text-[#F4C430]",
                    !isAvailable && "text-white/20 cursor-not-allowed"
                  )}
                >
                  {day}
                  {hasIndicator && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#F4C430]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Time Slots */}
      <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-[#F4C430]/10 bg-black/40 p-6 flex flex-col">
        {selectedDate ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm">
                <span className="font-medium text-white capitalize">
                  {new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("fr-FR", { weekday: "short" })}
                </span>
                <span className="text-white/50">, {new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex gap-1 rounded-lg bg-white/5 p-1">
                <button
                  onClick={() => setTimeFormat("12h")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    timeFormat === "12h"
                      ? "bg-[#F4C430] text-black"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  12h
                </button>
                <button
                  onClick={() => setTimeFormat("24h")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium rounded transition-colors",
                    timeFormat === "24h"
                      ? "bg-[#F4C430] text-black"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  24h
                </button>
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-2 overflow-y-auto pr-2 scrollbar-hide max-h-[250px] lg:max-h-[300px] flex-1">
              {timeSlots.map((slot) => {
                const isSelected = slot.time === selectedTime
                return (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeClick(slot.time)}
                    disabled={!slot.available}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      isSelected &&
                      "bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/30 scale-[1.02]",
                      !isSelected &&
                      slot.available &&
                      "bg-white/5 text-white hover:bg-[#F4C430]/20 hover:text-[#F4C430]",
                      !slot.available && "text-white/20 cursor-not-allowed"
                    )}
                  >
                    {formatTime(slot.time)}
                  </button>
                )
              })}
            </div>

            {/* Bouton de confirmation */}
            {onConfirm && (
              <div className="pt-4 mt-4 border-t border-[#F4C430]/10">
                <Button
                  onClick={handleConfirm}
                  disabled={!canConfirm || isSubmitting}
                  className={cn(
                    "w-full h-12 rounded-xl font-semibold transition-all",
                    canConfirm && !isSubmitting
                      ? "bg-[#F4C430] text-black hover:bg-[#F4C430]/90 shadow-lg shadow-[#F4C430]/20"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmer le rendez-vous
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm text-center px-4">
            Sélectionnez une date pour voir les créneaux disponibles
          </div>
        )}

        <div className="pt-4 mt-auto border-t border-[#F4C430]/10">
          <p className="text-xs text-white/30 text-right">
            powered by <span className="text-[#F4C430]/60">{brandName}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
