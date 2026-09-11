type SignalLineProps = {
  compact?: boolean;
};

export default function SignalLine({ compact = false }: SignalLineProps) {
  return (
    <svg
      className={`signal-line${compact ? " signal-line-compact" : ""}`}
      viewBox="0 0 720 260"
      role="img"
      aria-label="시간이 흐르며 감지, 이해, 알림으로 이어지는 변화 흐름"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={compact ? "signalFadeCompact" : "signalFade"} x1="0" x2="1">
          <stop offset="0" stopColor="#0a8568" stopOpacity="0" />
          <stop offset="0.28" stopColor="#0a8568" stopOpacity="0.2" />
          <stop offset="1" stopColor="#0a8568" stopOpacity="0" />
        </linearGradient>
        <filter id={compact ? "signalGlowCompact" : "signalGlow"} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <path
        className="signal-line-glow"
        d="M8 205 C118 120 172 204 270 132 C365 62 437 178 526 106 C591 54 623 12 712 36"
        filter={`url(#${compact ? "signalGlowCompact" : "signalGlow"})`}
        stroke={`url(#${compact ? "signalFadeCompact" : "signalFade"})`}
      />
      <path className="signal-line-echo" d="M8 220 C116 158 183 218 282 151 C374 88 440 204 534 132 C608 75 642 51 712 69" />
      <path className="signal-line-path" d="M8 205 C118 120 172 204 270 132 C365 62 437 178 526 106 C591 54 623 12 712 36" />
      <g className="signal-point signal-point-detect">
        <circle cx="140" cy="166" r="7" />
        <line x1="140" y1="178" x2="140" y2="204" />
        <text x="140" y="223">변화를 포착하고</text>
        <text className="signal-caption" x="140" y="241">Detect</text>
      </g>
      <g className="signal-point signal-point-understand">
        <circle cx="318" cy="116" r="7" />
        <line x1="318" y1="128" x2="318" y2="154" />
        <text x="318" y="173">맥락을 이해하고</text>
        <text className="signal-caption" x="318" y="191">Understand</text>
      </g>
      <g className="signal-point signal-point-alert">
        <circle cx="505" cy="118" r="6" />
        <line x1="505" y1="130" x2="505" y2="156" />
        <text x="505" y="175">중요한 변화만 알리고</text>
        <text className="signal-caption" x="505" y="193">Alert</text>
      </g>
      <g className="signal-point signal-point-you">
        <circle className="signal-ring" cx="696" cy="38" r="19" />
        <circle cx="696" cy="38" r="10" />
      </g>
    </svg>
  );
}
