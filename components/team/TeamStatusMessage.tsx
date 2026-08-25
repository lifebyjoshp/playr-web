import type { MessageType } from "./teamTypes";

type TeamStatusMessageProps = {
  message: string;
  type: MessageType;
};

export default function TeamStatusMessage({
  message,
  type,
}: TeamStatusMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-6 rounded-2xl p-4 text-sm font-medium ${
        type === "success"
          ? "bg-green-500/20 text-green-100"
          : type === "error"
            ? "bg-red-500/20 text-red-100"
            : "bg-white/10 text-white/75"
      }`}
    >
      {message}
    </div>
  );
}
