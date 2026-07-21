"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Icon } from "./icon";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

/** Password field with a show/hide toggle, for use with react-hook-form's register() spread. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input ref={ref} type={visible ? "text" : "password"} className={`${className ?? ""} pr-10`} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-container"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} className="text-[20px] leading-none" />
      </button>
    </div>
  );
});
