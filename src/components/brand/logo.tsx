import { cn } from '@/lib/utils';

/** The IdeaBloom mark: five lavender petals around a deep-lavender centre. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-8 shrink-0', className)}
    >
      <g transform="translate(16 16)">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="0"
            cy="-7.5"
            rx="5"
            ry="7.5"
            transform={`rotate(${angle})`}
            className="fill-lavender"
            opacity="0.85"
          />
        ))}
        <circle r="4.2" className="fill-lavender-deep" />
        <circle r="1.6" cx="-1" cy="-1" fill="white" opacity="0.6" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
        Idea<span className="text-lavender-deep">Bloom</span>
      </span>
    </span>
  );
}
