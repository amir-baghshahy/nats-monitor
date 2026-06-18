interface LoadingSpinnerProps {
  size?: "small" | "normal" | "large";
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = "normal",
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    normal: "h-8 w-8 border-2",
    large: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${className || ""}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-dark-border border-t-primary-500 animate-spin`}
      />
      {text && <p className="mt-3 text-sm text-dark-muted">{text}</p>}
    </div>
  );
}
