"use client";

import React, { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  name: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  hasError,
  disabled,
  className,
}) => {
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={cn("relative", className)}>
        <ListboxButton
          className={cn(
            "relative w-full cursor-pointer rounded-xl border bg-white py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-200",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            hasError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <span
            className={cn("block truncate", !selectedOption && "text-gray-400")}
          >
            {selectedOption?.name || placeholder}
          </span>
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
            {options.map((option) => (
              <ListboxOption
                key={option.id}
                value={option.id}
                disabled={option.disabled}
                className={({ active, selected }) =>
                  cn(
                    "relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors",
                    active && "bg-blue-50",
                    selected && "bg-blue-50",
                    option.disabled && "cursor-not-allowed opacity-50"
                  )
                }
              >
                {({ selected }) => (
                  <>
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "block truncate font-medium",
                          selected ? "text-blue-700" : "text-gray-900"
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
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
};

Select.displayName = "Select";
