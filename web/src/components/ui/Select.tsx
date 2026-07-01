import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: SelectProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || placeholder || "";

  // Calculate dropdown position when opened
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap
        left: isRTL ? rect.right : rect.left,
        width: rect.width,
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideButton = buttonRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideButton && !insideDropdown) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectBaseClasses = "relative w-full";
  const buttonClasses = `
    input relative flex items-center justify-between gap-2
    ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
    ${className}
  `;

  return (
    <div ref={selectRef} className={selectBaseClasses}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={handleToggle}
        className={buttonClasses}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isRTL ? "rtl-flip" : ""}`}
        />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[99999] max-h-60 overflow-auto rounded-xl border border-dark-border/70 bg-dark-card/95 shadow-xl backdrop-blur-sm scrollbar-thin"
            style={{
              top: `${dropdownPosition.top}px`,
              left: isRTL ? "auto" : `${dropdownPosition.left}px`,
              right: isRTL ? `${window.innerWidth - dropdownPosition.left}px` : "auto",
              width: `${dropdownPosition.width}px`,
            }}
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={value === option.value}
                disabled={option.disabled}
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={`
                  w-full px-4 py-2.5 text-start text-sm transition-colors
                  ${
                    option.disabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-dark-border/60"
                  }
                  ${
                    value === option.value
                      ? "bg-primary-500/20 text-primary-300 font-medium"
                      : "text-dark-text"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
