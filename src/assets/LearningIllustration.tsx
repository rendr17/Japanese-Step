const LearningIllustration = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 400 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="340" cy="60" r="6" fill="#C4684F" />
    <circle cx="60" cy="40" r="4" fill="#4A4038" />
    <circle cx="370" cy="280" r="5" fill="#C4684F" opacity="0.5" />
    <rect x="30" y="300" width="8" height="8" fill="#C4684F" opacity="0.7" transform="rotate(15 34 304)" />
    <rect x="350" y="120" width="6" height="6" fill="#4A4038" opacity="0.6" transform="rotate(-20 353 123)" />

    <path
      d="M80 120 L200 100 L200 280 L80 300 Z"
      fill="#F5F0EA"
      stroke="#4A4038"
      strokeWidth="2"
    />
    <path
      d="M200 100 L320 120 L320 300 L200 280 Z"
      fill="#F5F0EA"
      stroke="#4A4038"
      strokeWidth="2"
    />
    <line x1="200" y1="100" x2="200" y2="280" stroke="#4A4038" strokeWidth="2" />

    <text x="110" y="160" fontFamily="Noto Sans JP, sans-serif" fontSize="28" fontWeight="700" fill="#C4684F">
      あ
    </text>
    <text x="150" y="200" fontFamily="Noto Sans JP, sans-serif" fontSize="22" fontWeight="700" fill="#4A4038">
      い
    </text>
    <text x="110" y="240" fontFamily="Noto Sans JP, sans-serif" fontSize="22" fontWeight="700" fill="#4A4038">
      う
    </text>

    <text x="230" y="170" fontFamily="Noto Sans JP, sans-serif" fontSize="32" fontWeight="700" fill="#C4684F">
      学
    </text>
    <text x="270" y="220" fontFamily="Noto Sans JP, sans-serif" fontSize="24" fontWeight="700" fill="#4A4038">
      習
    </text>

    <rect x="290" y="80" width="12" height="80" rx="2" fill="#C4684F" stroke="#4A4038" strokeWidth="1.5" transform="rotate(25 296 120)" />
    <polygon points="295,55 301,75 289,75" fill="#4A4038" transform="rotate(25 296 65)" />

    <ellipse cx="320" cy="250" rx="50" ry="35" fill="#C4684F" stroke="#4A4038" strokeWidth="1.5" />
    <text x="320" y="258" textAnchor="middle" fontFamily="Noto Sans JP, sans-serif" fontSize="18" fontWeight="700" fill="#F5F0EA">
      うまい!
    </text>
  </svg>
);

export default LearningIllustration;
