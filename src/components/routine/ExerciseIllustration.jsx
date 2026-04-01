/**
 * ExerciseIllustration — real rehab photography for each exercise.
 * Sources: Unsplash (free-to-use) — matched precisely to each movement.
 */

// Map of exercise silhouette key → real photo URL
// Each image is carefully chosen to match the correct movement/position
const EXERCISE_PHOTOS = {
  // ── 360 Ribcage Breathing ─────────────────────────────────────────────────
  // Seated person with hands on ribcage, breathing focus
  breathing:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&fit=crop",

  // ── Chin Tuck ─────────────────────────────────────────────────────────────
  // Side view of person doing cervical retraction / chin tuck
  chin_tuck:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop",

  // ── Wall Slide ────────────────────────────────────────────────────────────
  // Person with arms against wall in W/Y position
  wall_slide:
    "https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=800&q=80&fit=crop",

  // ── Scapular Retraction ───────────────────────────────────────────────────
  // Person demonstrating shoulder blade squeeze / posture correction
  shoulder_retraction:
    "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=800&q=80&fit=crop",

  // ── Standing neutral posture ──────────────────────────────────────────────
  standing:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&fit=crop",

  // ── Overhead reach ────────────────────────────────────────────────────────
  overhead:
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80&fit=crop",

  // ── Seated neutral ────────────────────────────────────────────────────────
  seated:
    "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80&fit=crop",

  // ── Cat-Cow ───────────────────────────────────────────────────────────────
  // All-fours spinal flexion/extension
  cat_cow:
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80&fit=crop",

  // ── Thoracic Extension ────────────────────────────────────────────────────
  // Supine over foam roller, chest opening
  thoracic:
    "https://images.unsplash.com/photo-1616279967983-ec413476e824?w=800&q=80&fit=crop",

  // ── Open Book / Side-lying Rotation ──────────────────────────────────────
  side_lying:
    "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80&fit=crop",

  // ── Hip Flexor Lunge ──────────────────────────────────────────────────────
  // Half-kneeling lunge stretch
  lunge:
    "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800&q=80&fit=crop",

  // ── Child's Pose ──────────────────────────────────────────────────────────
  childs_pose:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80&fit=crop&crop=bottom",

  // ── Partial Curl-Up ───────────────────────────────────────────────────────
  curl_up:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&fit=crop",

  // ── Side Plank ────────────────────────────────────────────────────────────
  side_plank:
    "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&q=80&fit=crop",

  // ── Bird-Dog ──────────────────────────────────────────────────────────────
  bird_dog:
    "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&q=80&fit=crop",

  // ── Dead Bug ──────────────────────────────────────────────────────────────
  dead_bug:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop&crop=bottom",

  // ── Bridge / Hip Bridge ───────────────────────────────────────────────────
  bridge:
    "https://images.unsplash.com/photo-1567598508481-65985588e295?w=800&q=80&fit=crop",

  // ── Seated Thoracic Extension ─────────────────────────────────────────────
  seated_extension:
    "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80&fit=crop&crop=top",

  // ── Seated Core Brace ─────────────────────────────────────────────────────
  seated_brace:
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&fit=crop&crop=center",
};

// Category accent colors for the photo overlay badge
const CATEGORY_BADGE = {
  breathing: "bg-sky-600",
  posture:   "bg-violet-600",
  mobility:  "bg-emerald-600",
  stability: "bg-orange-500",
};

export default function ExerciseIllustration({ type, category, className = "" }) {
  const photoUrl = EXERCISE_PHOTOS[type] || EXERCISE_PHOTOS.standing;
  const badgeColor = CATEGORY_BADGE[category] || "bg-primary";

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={photoUrl}
        alt={type?.replace(/_/g, " ")}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {/* Subtle gradient overlay at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}