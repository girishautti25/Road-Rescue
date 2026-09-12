import { CORRIDOR_LENGTH_KM } from "@/lib/roadrescue/seed";
import type { Emergency, EmergencyButton, Pod, Station } from "@/lib/roadrescue/types";
import { cn } from "@/lib/utils";

interface Props {
  stations: Station[];
  pods: Pod[];
  buttons?: EmergencyButton[];
  emergencies?: Emergency[];
  highlightKm?: number | null;
  compact?: boolean;
  className?: string;
}

const W = 1000;

function x(km: number) {
  return 40 + (km / CORRIDOR_LENGTH_KM) * (W - 80);
}

/** SVG schematic of the NH-44 / Ghat Road corridor with rail lines and pods. */
export function HighwayMap({
  stations,
  pods,
  buttons = [],
  emergencies = [],
  highlightKm = null,
  compact = false,
  className,
}: Props) {
  const H = compact ? 150 : 230;
  const road = compact ? 70 : 108;
  const rail = road + 34;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Highway corridor schematic">
        <rect x="0" y="0" width={W} height={H} fill="transparent" />
        {/* road */}
        <rect x={20} y={road - 18} width={W - 40} height={36} rx={6} fill="var(--color-muted)" />
        <line
          x1={20}
          y1={road}
          x2={W - 20}
          y2={road}
          stroke="var(--color-background)"
          strokeWidth={2}
          strokeDasharray="18 14"
        />
        {/* rail line */}
        <line x1={20} y1={rail} x2={W - 20} y2={rail} stroke="var(--color-rail)" strokeWidth={4} />
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1={24 + i * 16}
            y1={rail - 6}
            x2={24 + i * 16}
            y2={rail + 6}
            stroke="var(--color-rail)"
            strokeWidth={1.5}
            opacity={0.5}
          />
        ))}

        {/* km ticks */}
        {Array.from({ length: 7 }, (_, i) => {
          const km = (CORRIDOR_LENGTH_KM / 6) * i;
          return (
            <text key={i} x={x(km)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted-foreground)">
              {km.toFixed(0)} km
            </text>
          );
        })}

        {/* buttons */}
        {buttons.map((b) => (
          <g key={b.id}>
            <circle
              cx={x(b.km)}
              cy={road - 30}
              r={compact ? 3 : 4}
              fill={b.online ? "var(--color-success)" : "var(--color-muted-foreground)"}
            />
          </g>
        ))}

        {/* stations */}
        {stations.map((s) => (
          <g key={s.id}>
            <rect
              x={x(s.km) - 16}
              y={rail + 14}
              width={32}
              height={26}
              rx={5}
              fill={s.status === "ONLINE" ? "var(--color-primary)" : "var(--color-muted-foreground)"}
            />
            <text x={x(s.km)} y={rail + 31} textAnchor="middle" fontSize={12} fontWeight="700" fill="var(--color-primary-foreground)">
              {s.id}
            </text>
          </g>
        ))}

        {/* emergencies */}
        {emergencies.map((e) => (
          <g key={e.id}>
            <circle cx={x(e.km)} cy={road} r={9} fill="var(--color-emergency)" opacity={0.25} />
            <circle cx={x(e.km)} cy={road} r={5} fill="var(--color-emergency)" />
            {!compact && (
              <text x={x(e.km)} y={road - 42} textAnchor="middle" fontSize={11} fontWeight="600" fill="var(--color-emergency)">
                {e.buttonId ?? e.id}
              </text>
            )}
          </g>
        ))}

        {highlightKm != null && (
          <line x1={x(highlightKm)} y1={road - 24} x2={x(highlightKm)} y2={rail + 10} stroke="var(--color-emergency)" strokeDasharray="4 4" strokeWidth={1.5} />
        )}

        {/* pods */}
        {pods.map((p) => (
          <g key={p.id} style={{ transition: "transform 300ms linear" }} transform={`translate(${x(p.km)},0)`}>
            <rect
              x={-14}
              y={rail - 12}
              width={28}
              height={18}
              rx={4}
              fill={p.status === "IDLE" || p.status === "CHARGING" ? "var(--color-rail)" : "var(--color-emergency)"}
            />
            <rect x={-8} y={rail - 8} width={16} height={6} rx={2} fill="var(--color-card)" opacity={0.7} />
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <Legend color="var(--color-primary)" label="Station" />
        <Legend color="var(--color-success)" label="Emergency button" />
        <Legend color="var(--color-emergency)" label="Active emergency / moving pod" />
        <Legend color="var(--color-rail)" label="Rail line & idle pod" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
