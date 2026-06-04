"use client";

import { useState, useId } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; // optional, for combining classes

export default function PasswordInput({
  label = "Password",
  placeholder = "",
  className,
  ...props
}) {
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <div className={cn("w-full max-w-sm *:not-first:mt-2", className)}>
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          className="pe-9 "
          {...props}
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          onClick={toggleVisibility}
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 transition-[color,box-shadow] outline-none focus:z-10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVisible ? <EyeOffIcon aria-hidden="true" size={16} /> : <EyeIcon aria-hidden="true" size={16} />}
        </button>
      </div>
    </div>
  );
}
