import { useEffect } from "react";

interface ModalWrapperProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function ModalWrapper({ isOpen, onClose, children }: ModalWrapperProps) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollContainer = document.querySelector("main > div") as HTMLElement | null;
    document.body.style.overflow = "hidden";
    if (scrollContainer) scrollContainer.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      if (scrollContainer) scrollContainer.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return <>{children}</>;
}
