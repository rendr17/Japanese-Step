import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  className?: string;
}

const SectionHeading = ({ icon: Icon, label, count, className }: SectionHeadingProps) => (
  <h3 className={cn("flex items-center gap-2 text-sm font-medium text-foreground normal-case tracking-normal", className)}>
    <span className="flex items-center justify-center w-7 h-7 rounded-md border border-border shrink-0">
      <Icon size={14} className="text-primary" strokeWidth={1.75} />
    </span>
    {label}
    {count !== undefined && <span className="text-muted-foreground">({count})</span>}
  </h3>
);

export default SectionHeading;
