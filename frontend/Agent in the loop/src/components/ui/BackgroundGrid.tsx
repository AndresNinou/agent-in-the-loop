export function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
      <div className="absolute inset-0 animate-drift">
        <svg
          width="100%"
          height="120%"
          className="absolute inset-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="0.5"
              />
            </pattern>
            <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connection nodes */}
          <g>
            <circle cx="20" cy="30" r="2" fill="url(#nodeGradient)" />
            <circle cx="45" cy="20" r="1.5" fill="url(#nodeGradient)" />
            <circle cx="70" cy="40" r="2.5" fill="url(#nodeGradient)" />
            <circle cx="30" cy="60" r="1.8" fill="url(#nodeGradient)" />
            <circle cx="80" cy="70" r="2" fill="url(#nodeGradient)" />
            <circle cx="15" cy="80" r="1.5" fill="url(#nodeGradient)" />
            <circle cx="60" cy="75" r="2.2" fill="url(#nodeGradient)" />
            <circle cx="85" cy="25" r="1.7" fill="url(#nodeGradient)" />
          </g>
          
          {/* Connection lines */}
          <g stroke="#22D3EE" strokeWidth="0.3" fill="none" opacity="0.4">
            <path d="M 20 30 L 45 20" />
            <path d="M 45 20 L 70 40" />
            <path d="M 30 60 L 60 75" />
            <path d="M 70 40 L 80 70" />
            <path d="M 15 80 L 30 60" />
            <path d="M 80 70 L 85 25" />
          </g>
        </svg>
      </div>
    </div>
  );
}
