"use client";

import React, { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: readonly MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  hasError,
  disabled,
  className,
}) => {
  const selectedOptions = options.filter((opt) => value.includes(opt.id));

  const handleChange = (selectedId: string) => {
    if (value.includes(selectedId)) {
      onChange(value.filter((id) => id !== selectedId));
    } else {
      onChange([...value, selectedId]);
    }
  };

  const removeOption = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== optionId));
  };

  return (
    <Listbox value={value} onChange={() => {}} disabled={disabled} multiple>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(
            "relative w-full cursor-pointer rounded-xl border bg-white py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-200 min-h-[52px]",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 hover:border-gray-300",
          )}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1 text-sm font-medium text-blue-800"
                >
                  {option.name}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeOption(e, option.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeOption(
                          e as unknown as React.MouseEvent,
                          option.id,
                        );
                      }
                    }}
                    className="rounded-full p-0.5 hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            anchor={false}
            modal={false}
            className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 focus:outline-none"
          >
            {options.map((option) => {
              const isSelected = value.includes(option.id);
              return (
                <ListboxOption
                  id={option.id}
                  key={option.id}
                  value={option.id}
                  disabled={option.disabled}
                  onClick={() => handleChange(option.id)}
                  className={cn(
                    "relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors",
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "block truncate font-medium",
                        isSelected ? "text-blue-700" : "text-gray-900",
                      )}
                    >
                      {option.name}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                      <Check className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </ListboxOption>
              );
            })}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
};

MultiSelect.displayName = "MultiSelect";
