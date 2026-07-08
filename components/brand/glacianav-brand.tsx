import { cn } from "@/lib/utils";

export function GlaciaNavMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_28px_rgba(9,20,38,0.18)]",
        tone === "dark" ? "bg-[#07111f]" : "bg-white",
        className
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-x-0 bottom-0 h-[42%] bg-[#316bf3]" />
      <span className="absolute inset-x-1.5 bottom-1.5 h-[24%] rounded-t-full bg-[#8fc3ff]/70" />
      <span
        className={cn(
          "absolute bottom-1.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[20px] border-x-transparent",
          tone === "dark" ? "border-b-white" : "border-b-[#07111f]"
        )}
      />
      <span className="absolute right-[10px] bottom-[9px] h-0 w-0 border-x-[5px] border-b-[10px] border-x-transparent border-b-[#dcecff]" />
      <span className="absolute inset-0 rounded-[14px] ring-1 ring-black/10 ring-inset" />
    </span>
  );
}

export function GlaciaNavBrand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <GlaciaNavMark />
      {!compact && (
        <span>
          <span className="block text-[15px] leading-none font-bold tracking-tight text-[#091426]">
            GlaciaNav
          </span>
          <span className="text-[10px] font-semibold tracking-[0.24em] text-[#7c8798]">
            CRM
          </span>
        </span>
      )}
    </div>
  );
}
