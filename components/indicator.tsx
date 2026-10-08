import { cn } from "@/lib/utils";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: "active" | "inactive" | "warning";
}

export function StatusIndicator({ 
  status = "active", 
  className,
  ...props 
}: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex size-2 rounded-full",
        {
          "bg-green-500": status === "active",
          "bg-gray-400": status === "inactive",
          "bg-yellow-500": status === "warning",
        },
        className
      )}
      {...props}
    />
  );
}
