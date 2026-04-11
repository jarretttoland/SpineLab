import React from "react";

const figure = "#0f172a";
const accent = "#2563eb";
const muted = "#cbd5e1";

function Arrow({ d }) {
  return (
    <path
      d={d}
      stroke={accent}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

function Tag({ x, y, text }) {
  const w = Math.max(34, text.length * 6 + 10);
  return (
    <>
      <rect x={x} y={y} width={w} height="16" rx="8" fill="white" opacity="0.96" />
      <text x={x + 6} y={y + 11} fontSize="9" fontWeight="700" fill={accent}>
        {text}
      </text>
    </>
  );
}

function Floor() {
  return <line x1="18" y1="154" x2="222" y2="154" stroke={muted} strokeWidth="2" />;
}

function Canvas({ children, viewBox = "0 0 240 180" }) {
  return (
    <div className="w-full h-full bg-white dark:bg-slate-950">
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {children}
      </svg>
    </div>
  );
}

const illustrations = {
  breathing: (
    <Canvas>
      <ellipse cx="120" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="112" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M88 60 Q80 88 84 120 L156 120 Q160 88 152 60 Q138 54 120 54 Q102 54 88 60Z" fill={figure} />
      <Arrow d="M84 84 L58 84 M58 84 L66 78 M58 84 L66 90" />
      <Arrow d="M156 84 L182 84 M182 84 L174 78 M182 84 L174 90" />
      <Tag x="88" y="66" text="expand ribs" />
    </Canvas>
  ),

  chin_tuck: (
    <Canvas>
      <line x1="112" y1="12" x2="112" y2="166" stroke={muted} strokeWidth="2" strokeDasharray="6 5" />
      <ellipse cx="128" cy="30" rx="18" ry="18" fill={figure} />
      <path d="M116 46 Q114 56 116 68" stroke={figure} strokeWidth="10" strokeLinecap="round" />
      <path d="M94 66 Q88 94 90 124 L138 124 Q140 94 136 66 Q126 60 114 60 Q104 60 94 66Z" fill={figure} />
      <Arrow d="M114 42 L88 42 M88 42 L96 36 M88 42 L96 48" />
      <Tag x="58" y="52" text="chin back" />
    </Canvas>
  ),

  wall_slide: (
    <Canvas>
      <rect x="182" y="16" width="8" height="148" rx="4" fill={muted} />
      <ellipse cx="118" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="110" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M94 60 Q88 88 92 124 L144 124 Q148 88 142 60 Q132 54 118 54 Q106 54 94 60Z" fill={figure} />
      <path d="M142 70 Q164 48 178 28" stroke={figure} strokeWidth="11" strokeLinecap="round" fill="none" />
      <Arrow d="M194 84 L194 48 M194 48 L188 56 M194 48 L200 56" />
      <Tag x="144" y="62" text="slide up" />
    </Canvas>
  ),

  shoulder_retraction: (
    <Canvas>
      <ellipse cx="120" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="112" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M88 60 Q82 88 86 124 L154 124 Q158 88 152 60 Q138 54 120 54 Q102 54 88 60Z" fill={figure} />
      <Arrow d="M84 86 L60 86 M60 86 L68 80 M60 86 L68 92" />
      <Arrow d="M156 86 L180 86 M180 86 L172 80 M180 86 L172 92" />
      <Tag x="86" y="68" text="shoulders back" />
    </Canvas>
  ),

  standing: (
    <Canvas>
      <line x1="120" y1="12" x2="120" y2="166" stroke={muted} strokeWidth="2" strokeDasharray="6 5" />
      <ellipse cx="120" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="112" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M90 60 Q84 88 88 124 L152 124 Q156 88 150 60 Q136 54 120 54 Q104 54 90 60Z" fill={figure} />
      <path d="M102 124 Q100 144 98 166" stroke={figure} strokeWidth="15" strokeLinecap="round" />
      <path d="M138 124 Q140 144 142 166" stroke={figure} strokeWidth="15" strokeLinecap="round" />
    </Canvas>
  ),

  overhead: (
    <Canvas>
      <ellipse cx="118" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="110" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M92 60 Q86 88 90 124 L146 124 Q150 88 144 60 Q132 54 118 54 Q104 54 92 60Z" fill={figure} />
      <path d="M144 70 Q160 46 158 20" stroke={figure} strokeWidth="11" strokeLinecap="round" fill="none" />
      <Arrow d="M166 42 L166 20 M166 20 L160 28 M166 20 L172 28" />
      <Tag x="146" y="56" text="reach up" />
    </Canvas>
  ),

  seated: (
    <Canvas>
      <rect x="66" y="124" width="106" height="8" rx="4" fill={muted} />
      <rect x="146" y="80" width="8" height="52" rx="4" fill={muted} />
      <ellipse cx="108" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="100" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M82 60 Q76 88 80 124 L128 124 Q132 88 128 60 Q118 54 108 54 Q94 54 82 60Z" fill={figure} />
      <path d="M90 124 L90 152" stroke={figure} strokeWidth="13" strokeLinecap="round" />
      <path d="M118 124 L118 152" stroke={figure} strokeWidth="13" strokeLinecap="round" />
    </Canvas>
  ),

  cat_cow: (
    <Canvas>
      <Floor />
      <ellipse cx="184" cy="80" rx="14" ry="14" fill={figure} />
      <path d="M170 86 Q160 90 154 100" stroke={figure} strokeWidth="11" strokeLinecap="round" />
      <path d="M154 100 Q124 66 92 100" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M124 66 L124 42 M124 42 L118 50 M124 42 L130 50" />
      <Tag x="130" y="54" text="round up" />
      <path d="M152 108 L152 146" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <path d="M98 108 L96 146" stroke={figure} strokeWidth="12" strokeLinecap="round" />
    </Canvas>
  ),

  thoracic: (
    <Canvas>
      <Floor />
      <ellipse cx="116" cy="146" rx="30" ry="8" fill={muted} />
      <path d="M34 128 Q74 118 116 106 Q150 116 182 128" stroke={figure} strokeWidth="22" strokeLinecap="round" fill="none" />
      <ellipse cx="28" cy="124" rx="14" ry="14" fill={figure} />
      <Arrow d="M94 102 Q118 78 142 102" />
      <Tag x="102" y="88" text="open chest" />
    </Canvas>
  ),

  side_lying: (
    <Canvas>
      <Floor />
      <ellipse cx="34" cy="92" rx="18" ry="18" fill={figure} />
      <path d="M54 92 Q102 86 162 88" stroke={figure} strokeWidth="24" strokeLinecap="round" />
      <path d="M154 88 Q168 100 166 126" stroke={figure} strokeWidth="14" strokeLinecap="round" />
      <path d="M98 70 Q116 42 136 32" stroke={figure} strokeWidth="9" strokeLinecap="round" />
      <Arrow d="M74 62 Q102 30 138 32" />
      <Tag x="82" y="50" text="open arm" />
    </Canvas>
  ),

  lunge: (
    <Canvas>
      <Floor />
      <ellipse cx="122" cy="30" rx="18" ry="18" fill={figure} />
      <rect x="114" y="46" width="16" height="14" rx="6" fill={figure} />
      <path d="M98 62 Q94 88 98 114 L140 114 Q144 88 138 62 Q128 56 122 56 Q108 56 98 62Z" fill={figure} />
      <path d="M108 114 Q92 126 70 146" stroke={figure} strokeWidth="14" strokeLinecap="round" />
      <path d="M130 114 Q138 132 142 148" stroke={figure} strokeWidth="14" strokeLinecap="round" />
      <Arrow d="M154 102 L166 90 M166 90 L154 90 M166 90 L162 102" />
      <Tag x="146" y="80" text="hips forward" />
    </Canvas>
  ),

  childs_pose: (
    <Canvas>
      <Floor />
      <ellipse cx="162" cy="112" rx="13" ry="14" fill={figure} />
      <path d="M152 112 Q120 90 82 96" stroke={figure} strokeWidth="22" strokeLinecap="round" />
      <path d="M72 108 Q58 118 52 146" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M122 86 L98 78 M98 78 L106 74 M98 78 L106 84" />
      <Tag x="110" y="72" text="reach long" />
    </Canvas>
  ),

  curl_up: (
    <Canvas>
      <Floor />
      <ellipse cx="38" cy="122" rx="14" ry="14" fill={figure} />
      <path d="M52 120 Q90 104 126 116" stroke={figure} strokeWidth="20" strokeLinecap="round" />
      <path d="M126 116 Q146 126 144 150" stroke={figure} strokeWidth="14" strokeLinecap="round" />
      <path d="M146 116 Q166 126 170 150" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M78 98 Q94 82 110 90" />
      <Tag x="86" y="84" text="small lift" />
    </Canvas>
  ),

  side_plank: (
    <Canvas>
      <Floor />
      <ellipse cx="54" cy="108" rx="13" ry="14" fill={figure} />
      <path d="M68 110 Q108 94 150 94" stroke={figure} strokeWidth="18" strokeLinecap="round" />
      <path d="M56 120 L46 150" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <path d="M142 94 L170 150" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M108 80 L108 58 M108 58 L102 66 M108 58 L114 66" />
      <Tag x="116" y="70" text="lift hips" />
    </Canvas>
  ),

  bird_dog: (
    <Canvas>
      <Floor />
      <ellipse cx="184" cy="80" rx="14" ry="14" fill={figure} />
      <path d="M170 86 Q160 90 154 100" stroke={figure} strokeWidth="11" strokeLinecap="round" />
      <path d="M154 100 Q124 94 92 100" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <path d="M152 108 L152 146" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <path d="M98 108 L96 146" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M96 100 L64 82 M64 82 L72 82 M64 82 L68 90" />
      <Arrow d="M154 100 L186 82 M186 82 L178 82 M186 82 L182 90" />
    </Canvas>
  ),

  dead_bug: (
    <Canvas>
      <Floor />
      <ellipse cx="48" cy="126" rx="13" ry="14" fill={figure} />
      <path d="M62 124 Q96 110 128 124" stroke={figure} strokeWidth="22" strokeLinecap="round" />
      <path d="M86 106 L70 78" stroke={figure} strokeWidth="10" strokeLinecap="round" />
      <path d="M110 106 L126 78" stroke={figure} strokeWidth="10" strokeLinecap="round" />
      <path d="M114 124 L142 102" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <path d="M96 124 L78 148" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M70 78 L56 58 M56 58 L56 66 M56 58 L64 62" />
      <Arrow d="M142 102 L162 118 M162 118 L154 118 M162 118 L158 110" />
    </Canvas>
  ),

  bridge: (
    <Canvas>
      <Floor />
      <ellipse cx="44" cy="128" rx="13" ry="14" fill={figure} />
      <path d="M58 126 Q94 98 132 118" stroke={figure} strokeWidth="22" strokeLinecap="round" />
      <path d="M132 118 Q150 126 150 150" stroke={figure} strokeWidth="14" strokeLinecap="round" />
      <path d="M150 118 Q170 126 176 150" stroke={figure} strokeWidth="12" strokeLinecap="round" />
      <Arrow d="M108 110 L108 84 M108 84 L102 92 M108 84 L114 92" />
      <Tag x="116" y="102" text="lift hips" />
    </Canvas>
  ),

  seated_extension: (
    <Canvas>
      <rect x="66" y="124" width="106" height="8" rx="4" fill={muted} />
      <rect x="146" y="82" width="8" height="50" rx="4" fill={muted} />
      <ellipse cx="108" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="100" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M82 60 Q76 88 80 124 L128 124 Q132 88 128 60 Q118 54 108 54 Q94 54 82 60Z" fill={figure} />
      <Arrow d="M132 86 Q148 72 142 54" />
    </Canvas>
  ),

  seated_brace: (
    <Canvas>
      <rect x="66" y="124" width="106" height="8" rx="4" fill={muted} />
      <ellipse cx="108" cy="28" rx="18" ry="18" fill={figure} />
      <rect x="100" y="44" width="16" height="14" rx="6" fill={figure} />
      <path d="M82 60 Q76 88 80 124 L128 124 Q132 88 128 60 Q118 54 108 54 Q94 54 82 60Z" fill={figure} />
      <path d="M90 92 L126 92" stroke={accent} strokeWidth="3" strokeDasharray="5 4" />
      <Tag x="94" y="80" text="brace" />
    </Canvas>
  ),
};

export default function ExerciseIllustration({ type = "standing", className = "" }) {
  return <div className={`w-full h-full ${className}`}>{illustrations[type] || illustrations.standing}</div>;
}