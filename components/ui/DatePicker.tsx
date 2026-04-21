"use client";

import React, { useState, useRef, useEffect, Fragment } from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select a date",
  hasError,
  disabled,
  className,
  minDate,
  maxDate,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? today : parsed;
    }
    return today;
  });

  const selectedDate = value ? new Date(value) : null;

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isToday = (year: number, month: number, day: number): boolean => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isSelected = (year: number, month: number, day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const handleDateClick = (day: number, close: () => void) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (!isDateDisabled(date)) {
      onChange(formatDate(date));
      close();
    }
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToPrevYear = () => {
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  };

  const goToNextYear = () => {
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
  };

  const goToToday = (close: () => void) => {
    const todayDate = new Date();
    setViewDate(todayDate);
    onChange(formatDate(todayDate));
    close();
  };

  const renderCalendar = (close: () => void) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: React.ReactNode[] = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const selected = isSelected(year, month, day);
      const todayDate = isToday(year, month, day);

      days.push(
        <button
          key={day}
          type="button"
          disabled={disabled}
          onClick={() => handleDateClick(day, close)}
          className={cn(
            "h-9 w-9 rounded-lg text-sm font-medium transition-all",
            "hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
            disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
            selected &&
              "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700",
            !selected && todayDate && "border-2 border-blue-500 text-blue-600",
            !selected && !todayDate && "text-gray-700"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <Popover className={cn("relative", className)}>
      {({ close }) => (
        <>
          <PopoverButton
            disabled={disabled}
            className={cn(
              "relative w-full cursor-pointer rounded-xl border bg-white py-3 pl-10 pr-4 text-left shadow-sm transition-all duration-200",
              "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
              hasError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-5 w-5 text-gray-400" />
            </span>
            <span className={cn(!value && "text-gray-400")}>
              {value ? formatDisplayDate(value) : placeholder}
            </span>
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel anchor="bottom start" className="z-[100] mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5 focus:outline-none ">
              {/* Header with navigation */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToPrevYear}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Previous Year"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Previous Month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>

                <span className="text-sm font-semibold text-gray-900">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Next Month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextYear}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    title="Next Year"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex h-9 w-9 items-center justify-center text-xs font-medium text-gray-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar(close)}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => goToToday(close)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      close();
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

DatePicker.displayName = "DatePicker";
