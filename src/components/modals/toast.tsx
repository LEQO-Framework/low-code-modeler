import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let count = 0;

    const interval = setInterval(() => {
      count += 1;
      setProgress(Math.min(count / steps, 1));

      if (count >= steps) {
        clearInterval(interval);
        onClose();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [type, duration]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";

  return (
    <div
      className={`fixed top-20 right-96 w-80 px-4 py-3 text-white rounded-lg shadow-lg ${bgColor} overflow-hidden z-[9999]`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <X size={18} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/40 overflow-hidden">
        <div
          className="h-1 bg-orange-500 origin-left"
          style={{
            transform: `scaleX(${progress})`,
            transition: "transform 0.1s linear",
          }}
        />
      </div>
    </div>
  );
};
