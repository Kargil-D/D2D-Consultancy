"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import InputField from "./InputField";

interface PasswordFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label = "Password", error, ...rest }, ref) {
    const [show, setShow] = useState(false);
    return (
      <InputField
        ref={ref}
        label={label}
        error={error}
        type={show ? "text" : "password"}
        icon={<Lock className="w-4 h-4" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        autoComplete="current-password"
        {...rest}
      />
    );
  },
);

export default PasswordField;
