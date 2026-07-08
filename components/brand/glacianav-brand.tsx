import { cn } from "@/lib/utils";

// V2 mark: flat ink square, white peak, red route stripe. No radius, no shadow.
export function GlaciaNavMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const ink = tone === "dark";
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden",
        ink ? "bg-[#131313]" : "border border-[#131313] bg-white",
        className
      )}
      aria-hidden="true"
    >
      {/* peak */}
      <span
        className={cn(
          "absolute bottom-[7px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[11px] border-b-[18px] border-x-transparent",
          ink ? "border-b-white" : "border-b-[#131313]"
        )}
      />
      {/* route stripe along the base — the blaze */}
      <span className="absolute inset-x-0 bottom-0 h-[4px] bg-[#da291c]" />
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
          <span className="type-poster block text-[16px] text-foreground">
            GlaciaNav
          </span>
          <span className="type-legend text-muted-foreground">CRM</span>
        </span>
      )}
    </div>
  );
}
