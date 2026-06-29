import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none transition-all duration-200";

    const variantStyles = {
      primary:
        "bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-500 hover:shadow-primary-500/30 active:scale-[0.98]",
      secondary:
        "border border-dark-border/70 bg-dark-card/70 text-dark-text hover:border-primary-500/40 hover:bg-dark-border/70 active:scale-[0.98]",
      danger:
        "bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500 hover:shadow-red-500/30 active:scale-[0.98]",
      ghost:
        "bg-transparent text-dark-text hover:bg-dark-bg/50 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-4 py-2 text-sm rounded-xl",
      lg: "px-6 py-3 text-base rounded-2xl",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
