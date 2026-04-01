/**
 * Premium vector exercise illustrations.
 * Consistent design language: stroke-based figures, clean motion arrows, medical rehab aesthetic.
 * All figures use a unified style: dark slate figure, blue accent arrows, neutral background.
 */

// ─── Shared style constants ────────────────────────────────────────────────
// Figure fill: currentColor (inherits from parent)
// Motion arrows: #3b82f6 (blue)
// Reference lines: #94a3b8 (slate-400) dashed
// Line weight: body parts 6–14px, arrows 2.5px

const silhouettes = {

  // ── 360 Ribcage Breathing ─────────────────────────────────────────────────
  breathing: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Head */}
      <ellipse cx="80" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="73" y="44" width="14" height="16" rx="6" fill="currentColor"/>
      {/* Torso */}
      <path d="M46 60 Q40 90 42 128 L118 128 Q120 90 114 60 Q98 55 80 55 Q62 55 46 60Z" fill="currentColor"/>
      {/* Ribcage expand arrows — lateral */}
      <path d="M38 88 L22 88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M22 88 L28 83 M22 88 L28 93" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M122 88 L138 88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M138 88 L132 83 M138 88 L132 93" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Ribcage expand arrows — posterior (back arc suggestion) */}
      <path d="M48 105 L34 112" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M112 105 L126 112" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      {/* Arms relaxed at sides */}
      <path d="M46 66 Q30 96 28 122" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M114 66 Q130 96 132 122" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <path d="M58 128 Q55 164 54 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M102 128 Q105 164 106 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Subtle chest/sternum line */}
      <line x1="80" y1="62" x2="80" y2="118" stroke="white" strokeWidth="1.5" opacity="0.12"/>
    </svg>
  ),

  // ── Chin Tuck ─────────────────────────────────────────────────────────────
  // Side profile: head glides straight back, chin level
  chin_tuck: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Plumb reference line */}
      <line x1="80" y1="10" x2="80" y2="210" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6,5" opacity="0.4"/>
      {/* Head — side profile, slightly forward of plumb */}
      <ellipse cx="88" cy="26" rx="20" ry="20" fill="currentColor"/>
      {/* Chin tuck arrow — horizontal backward */}
      <path d="M80 36 L62 36" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M62 36 L68 31 M62 36 L68 41" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Small label area */}
      <text x="46" y="50" fontSize="9" fill="#3b82f6" fontWeight="600" opacity="0.85">chin back</text>
      {/* Neck — upright cervical curve */}
      <path d="M78 45 Q76 55 77 64" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Torso — side view */}
      <path d="M54 64 Q50 95 52 132 L96 132 Q100 95 96 64 Q86 59 78 59 Q68 62 54 64Z" fill="currentColor"/>
      {/* Arms */}
      <path d="M54 72 Q42 98 40 124" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <path d="M62 132 Q60 164 59 196" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M86 132 Q88 164 89 196" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Wall Slide ────────────────────────────────────────────────────────────
  // Arms sliding up a wall, scapular control
  wall_slide: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Wall */}
      <rect x="118" y="8" width="8" height="205" rx="3" fill="currentColor" opacity="0.12"/>
      <line x1="118" y1="8" x2="118" y2="213" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
      {/* Head */}
      <ellipse cx="74" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="67" y="44" width="13" height="14" rx="5" fill="currentColor"/>
      {/* Torso against wall */}
      <path d="M48 58 Q44 88 46 124 L102 124 Q104 88 100 58 Q88 53 74 53 Q60 53 48 58Z" fill="currentColor"/>
      {/* Right arm raised along wall — W position */}
      <path d="M100 66 Q110 44 115 24" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Left arm W position */}
      <path d="M48 66 Q38 88 36 118" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Up arrow showing direction */}
      <path d="M124 80 L124 50" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M124 50 L120 58 M124 50 L128 58" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Legs */}
      <path d="M58 124 Q56 158 55 194" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M92 124 Q94 158 95 194" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Scapular Retraction ───────────────────────────────────────────────────
  // Shoulder blades drawing together horizontally — NOT shrugging
  shoulder_retraction: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Head */}
      <ellipse cx="80" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="73" y="44" width="14" height="14" rx="5" fill="currentColor"/>
      {/* Torso */}
      <path d="M46 58 Q42 88 44 124 L116 124 Q118 88 114 58 Q98 53 80 53 Q62 53 46 58Z" fill="currentColor"/>
      {/* Scapular squeeze — horizontal arrows at mid-back level */}
      <path d="M42 88 L26 88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 88 L32 83 M26 88 L32 93" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M118 88 L134 88" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M134 88 L128 83 M134 88 L128 93" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arms slightly drawn back */}
      <path d="M46 65 Q30 90 28 118" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M114 65 Q130 90 132 118" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Spine reference line */}
      <line x1="80" y1="55" x2="80" y2="122" stroke="white" strokeWidth="1.5" opacity="0.15"/>
      {/* Legs */}
      <path d="M58 124 Q56 158 55 194" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M102 124 Q104 158 105 194" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Standing (neutral posture) ────────────────────────────────────────────
  standing: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Plumb line */}
      <line x1="80" y1="8" x2="80" y2="212" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6,5" opacity="0.35"/>
      {/* Head */}
      <ellipse cx="80" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="73" y="44" width="14" height="14" rx="5" fill="currentColor"/>
      {/* Torso */}
      <path d="M48 58 Q44 88 46 124 L114 124 Q116 88 112 58 Q96 53 80 53 Q64 53 48 58Z" fill="currentColor"/>
      {/* Arms */}
      <path d="M48 65 Q34 92 32 118" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M112 65 Q126 92 128 118" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <path d="M60 124 Q57 158 56 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M100 124 Q103 158 104 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Overhead (arm reach) ──────────────────────────────────────────────────
  overhead: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Head */}
      <ellipse cx="80" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="73" y="44" width="14" height="14" rx="5" fill="currentColor"/>
      {/* Torso */}
      <path d="M48 58 Q44 88 46 124 L114 124 Q116 88 112 58 Q96 53 80 53 Q64 53 48 58Z" fill="currentColor"/>
      {/* Right arm raised */}
      <path d="M112 62 Q122 36 118 14" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Up arrow */}
      <path d="M122 30 L122 14" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M122 14 L118 22 M122 14 L126 22" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Left arm relaxed */}
      <path d="M48 65 Q34 92 32 118" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <path d="M60 124 Q57 158 56 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M100 124 Q103 158 104 196" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Seated (neutral, chair) ───────────────────────────────────────────────
  seated: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Chair seat */}
      <rect x="22" y="128" width="116" height="8" rx="4" fill="currentColor" opacity="0.18"/>
      {/* Chair legs */}
      <rect x="28" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="124" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      {/* Chair back */}
      <rect x="120" y="72" width="8" height="64" rx="4" fill="currentColor" opacity="0.12"/>
      {/* Head */}
      <ellipse cx="74" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="67" y="44" width="13" height="14" rx="5" fill="currentColor"/>
      {/* Torso — upright */}
      <path d="M48 58 Q44 88 46 128 L100 128 Q102 88 98 58 Q88 53 74 53 Q60 53 48 58Z" fill="currentColor"/>
      {/* Spine ref line */}
      <line x1="74" y1="56" x2="74" y2="126" stroke="white" strokeWidth="1.5" opacity="0.14"/>
      {/* Arms resting */}
      <path d="M48 68 Q36 94 34 118" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M98 68 Q110 94 112 118" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Thighs */}
      <path d="M52 128 Q50 140 50 164" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M94 128 Q96 140 96 164" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      {/* Shins — 90° bend */}
      <path d="M50 162 Q50 180 50 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M96 162 Q96 180 96 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Cat-Cow ───────────────────────────────────────────────────────────────
  // All-fours, side view. Shows spine flexion (cat) with up arrow
  cat_cow: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Head — side profile */}
      <ellipse cx="185" cy="56" rx="18" ry="17" fill="currentColor"/>
      {/* Neck */}
      <path d="M168 62 Q158 70 152 78" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Spine — arched up (cat) */}
      <path d="M152 78 Q122 46 92 78" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Pelvis/tail */}
      <path d="M92 78 Q80 72 68 68" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Up arrow at apex of spine */}
      <path d="M122 42 L122 26" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M122 26 L118 34 M122 26 L126 34" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Front arms */}
      <path d="M148 86 L148 126" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M164 84 L166 124" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Back legs */}
      <path d="M92 86 L90 126" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M108 84 L110 124" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Floor */}
      <line x1="30" y1="130" x2="200" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.3"/>
    </svg>
  ),

  // ── Thoracic Extension (over foam roller) ────────────────────────────────
  // Supine, foam roller under thoracic spine, arms behind head, chest opens upward
  thoracic: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Foam roller */}
      <ellipse cx="115" cy="122" rx="30" ry="10" fill="currentColor" opacity="0.12"/>
      <ellipse cx="115" cy="122" rx="28" ry="8" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none"/>
      {/* Upper body — arching over roller */}
      <path d="M30 108 Q70 100 115 88 Q145 96 175 108" stroke="currentColor" strokeWidth="24" strokeLinecap="round" fill="none"/>
      {/* Head */}
      <ellipse cx="24" cy="104" rx="16" ry="18" fill="currentColor"/>
      {/* Arms behind head */}
      <path d="M32 96 Q26 82 28 68" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Knees bent, feet flat */}
      <path d="M175 108 Q186 116 182 130" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M185 108 Q196 116 194 130" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Chest opens — arc arrow */}
      <path d="M90 80 Q115 60 140 80" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5,4" fill="none"/>
      <path d="M140 80 L134 74 M140 80 L136 86" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // ── Open Book Rotation ────────────────────────────────────────────────────
  // Side-lying, top arm rotates open (thoracic rotation). Accurate arc.
  side_lying: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head */}
      <ellipse cx="30" cy="72" rx="18" ry="18" fill="currentColor"/>
      {/* Body side-lying */}
      <path d="M46 72 Q100 66 160 68" stroke="currentColor" strokeWidth="30" strokeLinecap="round" fill="none"/>
      {/* Knees stacked and bent */}
      <path d="M152 68 Q165 80 163 104" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      <path d="M163 68 Q174 80 172 104" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Bottom arm — extended forward */}
      <path d="M52 60 Q70 46 88 42" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Top arm — rotating open to ceiling */}
      <path d="M88 52 Q100 30 116 16" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Rotation arc arrow */}
      <path d="M68 44 Q92 18 118 18" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5,4" fill="none"/>
      <path d="M118 18 L110 14 M118 18 L114 24" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // ── Hip Flexor Lunge ──────────────────────────────────────────────────────
  // Half-kneeling lunge, upright torso, hip extension through back leg
  lunge: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="196" x2="150" y2="196" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head */}
      <ellipse cx="80" cy="24" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="73" y="42" width="14" height="13" rx="5" fill="currentColor"/>
      {/* Torso — upright */}
      <path d="M56 55 Q52 80 54 108 L106 108 Q108 80 104 55 Q92 50 80 50 Q68 50 56 55Z" fill="currentColor"/>
      {/* Front leg — knee at 90° */}
      <path d="M62 108 Q56 134 52 160" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M52 160 Q38 168 30 170" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Back leg — extended, knee on floor */}
      <path d="M98 108 Q112 140 118 170" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M118 170 Q130 178 138 180" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Hip extension arrow */}
      <path d="M100 110 L116 122" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M116 122 L108 120 M116 122 L114 114" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Arms */}
      <path d="M56 62 Q44 88 42 112" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M104 62 Q116 88 118 112" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Child's Pose ──────────────────────────────────────────────────────────
  childs_pose: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head down, forehead near floor */}
      <ellipse cx="28" cy="96" rx="16" ry="14" fill="currentColor"/>
      {/* Arms extending forward along floor */}
      <path d="M42 92 Q75 80 110 76 Q140 74 165 74" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Torso rounded forward */}
      <path d="M42 98 Q62 108 80 114 Q100 118 118 116" stroke="currentColor" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* Hips elevated */}
      <path d="M118 116 Q130 96 132 76" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Shins/feet on floor */}
      <path d="M132 76 Q152 76 170 76" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none"/>
      {/* Forward reach arrows */}
      <path d="M172 70 L188 70" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M188 70 L182 65 M188 70 L182 75" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // ── Partial Curl-Up ───────────────────────────────────────────────────────
  // Supine, knees bent, shoulders lift ~30°. Hands under lumbar.
  curl_up: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Body flat on back */}
      <path d="M30 102 Q90 100 130 100 Q155 100 175 102" stroke="currentColor" strokeWidth="22" strokeLinecap="round" fill="none"/>
      {/* Head + shoulders lifted ~30° */}
      <ellipse cx="28" cy="80" rx="15" ry="16" fill="currentColor"/>
      <path d="M42 82 Q62 74 82 76" stroke="currentColor" strokeWidth="16" strokeLinecap="round" fill="none"/>
      {/* Lift arrow */}
      <path d="M44 70 L44 56" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M44 56 L40 64 M44 56 L48 64" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Hands under lumbar */}
      <path d="M90 104 Q105 112 120 110" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {/* Knees bent */}
      <path d="M175 102 Q186 88 184 68" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M184 102 Q194 88 193 68" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Side Plank ────────────────────────────────────────────────────────────
  // Elbow side plank, body in straight diagonal line
  side_plank: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head */}
      <ellipse cx="185" cy="50" rx="18" ry="18" fill="currentColor"/>
      {/* Body in one straight plank line */}
      <path d="M168 64 Q128 80 90 94 Q60 104 34 116" stroke="currentColor" strokeWidth="24" strokeLinecap="round" fill="none"/>
      {/* Forearm on floor */}
      <path d="M34 116 Q24 118 18 118" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Top arm raised */}
      <path d="M120 80 Q130 58 132 44" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Lift arrow at hip */}
      <path d="M92 86 L92 70" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M92 70 L88 78 M92 70 L96 78" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Feet stacked */}
      <path d="M34 116 Q24 122 18 128" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Bird-Dog ──────────────────────────────────────────────────────────────
  // Quadruped, opposite arm/leg extended. Flat spine.
  bird_dog: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head */}
      <ellipse cx="185" cy="54" rx="16" ry="15" fill="currentColor"/>
      {/* Neck */}
      <path d="M170 58 Q158 64 150 70" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Horizontal torso — flat spine */}
      <path d="M150 70 Q110 68 72 70" stroke="currentColor" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* Extended right arm (forward) */}
      <path d="M150 64 Q164 46 176 32" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Forward arrow */}
      <path d="M178 28 L186 18" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M186 18 L180 22 M186 18 L184 26" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Extended left leg (back) */}
      <path d="M72 70 Q58 62 40 54" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Back arrow */}
      <path d="M36 50 L26 44" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 44 L32 48 M26 44 L30 52" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Support arm down */}
      <path d="M136 76 L136 110" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Support knee down */}
      <path d="M88 76 L88 110" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Dead Bug ──────────────────────────────────────────────────────────────
  // Supine, lumbar pressed flat. Opposite arm/leg extend away from center.
  dead_bug: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head */}
      <ellipse cx="110" cy="30" rx="18" ry="18" fill="currentColor"/>
      {/* Torso flat on back */}
      <path d="M110 48 Q110 78 110 110" stroke="currentColor" strokeWidth="26" strokeLinecap="round" fill="none"/>
      {/* Right arm extending back overhead */}
      <path d="M98 60 Q74 46 52 38" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      <path d="M50 34 L40 28" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M40 28 L46 34 M40 28 L46 22" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Left arm bent — 90° tabletop */}
      <path d="M122 60 Q146 56 168 58" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
      {/* Left leg — 90° tabletop (knee up) */}
      <path d="M98 110 Q80 94 68 72" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      {/* Right leg extending away */}
      <path d="M122 110 Q144 106 168 108" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M170 106 L182 104" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M182 104 L176 100 M182 104 L176 108" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),

  // ── Bridge / Hip Bridge ───────────────────────────────────────────────────
  // Supine, hips lifted to neutral. Feet flat, knees bent at ~90°.
  bridge: (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floor */}
      <line x1="10" y1="130" x2="210" y2="130" stroke="#94a3b8" strokeWidth="1.5" opacity="0.28"/>
      {/* Head on floor */}
      <ellipse cx="22" cy="96" rx="16" ry="16" fill="currentColor"/>
      {/* Shoulders/upper back flat */}
      <path d="M36 96 Q68 96 88 90" stroke="currentColor" strokeWidth="22" strokeLinecap="round" fill="none"/>
      {/* Hips lifted in clean diagonal */}
      <path d="M88 90 Q108 58 128 62" stroke="currentColor" strokeWidth="18" strokeLinecap="round" fill="none"/>
      {/* Hip lift arrow */}
      <path d="M108 52 L108 36" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M108 36 L104 44 M108 36 L112 44" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Shins vertical to feet */}
      <path d="M128 62 Q136 90 134 120" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M138 62 Q148 90 148 120" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none"/>
      {/* Arms flat at sides */}
      <path d="M38 102 Q60 110 80 110" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Seated Thoracic Extension ─────────────────────────────────────────────
  // Seated, hands behind head, upper back extends OVER chair back. NOT lumbar.
  seated_extension: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Chair */}
      <rect x="22" y="128" width="116" height="8" rx="4" fill="currentColor" opacity="0.18"/>
      <rect x="28" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="124" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="120" y="72" width="8" height="62" rx="4" fill="currentColor" opacity="0.18"/>
      {/* Head — slightly extended back */}
      <ellipse cx="72" cy="24" rx="18" ry="20" fill="currentColor"/>
      {/* Neck gently extended */}
      <path d="M72 43 Q70 54 72 64" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Torso — upper back arching into chair back */}
      <path d="M48 64 Q44 92 46 128 L100 128 Q102 96 100 64 Q90 58 72 58 Q58 60 48 64Z" fill="currentColor"/>
      {/* Chest opens — arc arrow up and back */}
      <path d="M54 78 Q68 58 86 72" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5,4" fill="none"/>
      <path d="M86 72 L80 68 M86 72 L82 78" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Hands behind head */}
      <path d="M48 66 Q36 56 32 44" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      <path d="M98 66 Q110 56 114 44" stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none"/>
      {/* Thighs + shins */}
      <path d="M52 128 Q50 148 50 166" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M94 128 Q96 148 96 166" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M50 164 Q50 180 50 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M96 164 Q96 180 96 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
    </svg>
  ),

  // ── Seated Core Brace ─────────────────────────────────────────────────────
  // Seated upright neutral spine. Subtle brace cue arrows inward at core.
  seated_brace: (
    <svg viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Chair */}
      <rect x="22" y="128" width="116" height="8" rx="4" fill="currentColor" opacity="0.18"/>
      <rect x="28" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      <rect x="124" y="136" width="8" height="60" rx="4" fill="currentColor" opacity="0.12"/>
      {/* Head */}
      <ellipse cx="74" cy="26" rx="18" ry="20" fill="currentColor"/>
      {/* Neck */}
      <rect x="67" y="44" width="13" height="14" rx="5" fill="currentColor"/>
      {/* Torso — perfectly upright */}
      <path d="M48 58 Q44 88 46 128 L102 128 Q104 88 100 58 Q90 53 74 53 Q60 53 48 58Z" fill="currentColor"/>
      {/* Plumb line */}
      <line x1="74" y1="10" x2="74" y2="210" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6,5" opacity="0.35"/>
      {/* Subtle core brace arrows — inward at navel level */}
      <path d="M44 96 L56 96" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M56 96 L50 91 M56 96 L50 101" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M104 96 L92 96" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M92 96 L98 91 M92 96 L98 101" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      {/* Arms resting on thighs */}
      <path d="M48 70 Q38 96 38 118" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      <path d="M100 70 Q110 96 110 118" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Thighs + shins */}
      <path d="M52 128 Q50 148 50 166" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M96 128 Q98 148 98 166" stroke="currentColor" strokeWidth="15" strokeLinecap="round" fill="none"/>
      <path d="M50 164 Q50 180 50 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M98 164 Q98 180 98 196" stroke="currentColor" strokeWidth="13" strokeLinecap="round" fill="none"/>
    </svg>
  ),

};

export default function ExerciseSilhouette({ type, className = "" }) {
  const svgContent = silhouettes[type] || silhouettes.standing;
  return (
    <div className={`text-foreground/85 ${className}`}>
      {svgContent}
    </div>
  );
}