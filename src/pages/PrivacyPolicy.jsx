// FILE: src/pages/PrivacyPolicy.jsx
// Replace your existing file with this entire file.
//
// What changed from your previous version:
//   - Section 3 now explicitly names Google's MediaPipe Pose Landmarker
//     and clarifies it runs on-device (Apple 5.1.1 requirement)
//   - Section 5 now lists Google (MediaPipe model + WASM CDN) as a third-party service
//   - NEW Section 6: "Your AI Consent & Controls" — describes the consent screen
//     and how users can revoke
//   - Section numbering shifted by 1 after the new section
//   - "Last Updated" date bumped to May 16, 2026
//
// Everything else is preserved from your original.

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "We collect only the information reasonably necessary to provide and improve the SpineLab experience.",
    subsections: [
      {
        subtitle: "Account Information",
        bullets: [
          "Email address",
          "Login credentials processed through secure authentication services",
          "Optional profile information you choose to provide",
        ],
      },
      {
        subtitle: "Wellness & App Usage Information",
        bullets: [
          "Onboarding responses, including goals, pain areas, activity level, limitations, and exercise preferences",
          "Plan adjustment selections and routine preferences",
          "Spine Score, progress history, streaks, and related in-app activity",
          "General app interaction data needed to operate features and improve performance",
        ],
      },
      {
        subtitle: "Posture Scan Data",
        bullets: [
          "Posture images you voluntarily capture or upload for analysis",
          "Body landmark coordinates derived from those images by an on-device AI model",
          "Derived posture results, scores, and movement observations generated from those images",
          "We do not capture photos without your intentional action inside the App",
        ],
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content:
      "We use your information to operate, personalize, maintain, and improve SpineLab. Specifically, we may use your information to:",
    bullets: [
      "Create and manage your account",
      "Generate posture analysis and Spine Score results",
      "Build and update your exercise plan and in-app recommendations",
      "Track progress, consistency, and routine completion over time",
      "Maintain app functionality, security, and performance",
      "Improve the quality, usability, and reliability of the App",
    ],
    footer:
      "We do not sell your personal information, and we do not use your data for third-party advertising or behavioral profiling.",
  },
  {
    title: "3. Posture Analysis & AI",
    content:
      "SpineLab uses automated computer vision to analyze posture images. We want to be specific about how this works, what AI model we use, and where it runs.",
    subsections: [
      {
        subtitle: "What AI we use",
        bullets: [
          "SpineLab uses Google's MediaPipe Pose Landmarker, an open-source pose detection model published by Google LLC",
          "The MediaPipe model file and its WebAssembly runtime are downloaded once from Google's public CDNs (jsDelivr and Google Cloud Storage) the first time you use the scan feature",
        ],
      },
      {
        subtitle: "Where the AI runs",
        bullets: [
          "After the one-time download, the MediaPipe model runs entirely on your device",
          "Your posture photos and any live video frames are not transmitted to Google or to any other third party for AI processing",
          "Only the numerical body landmark coordinates produced by the on-device model are used to calculate your Spine Score and posture findings",
        ],
      },
      {
        subtitle: "Limitations of the analysis",
        bullets: [
          "Posture analysis results are estimates only",
          "Results may be incomplete, inaccurate, or not medically precise",
          "Spine Scores, posture findings, and movement insights are provided for general wellness and educational purposes only",
          "SpineLab does not provide medical advice, medical diagnosis, or treatment",
        ],
      },
    ],
    footer:
      "You should not rely on SpineLab posture analysis as a substitute for evaluation by a licensed healthcare professional.",
  },
  {
    title: "4. Exercise & Wellness Information",
    content:
      "SpineLab may provide exercise suggestions, movement routines, and wellness guidance based on your responses and app usage.",
    bullets: [
      "These routines are general wellness suggestions only",
      "They are not medical treatment or prescribed rehabilitation",
      "They may not be appropriate for your specific condition, injury, pain level, or health status",
      "You are responsible for determining whether participation is appropriate for you",
    ],
    footer:
      "Stop immediately and seek professional guidance if you experience pain, worsening symptoms, dizziness, weakness, or any concerning response during use.",
  },
  {
    title: "5. Third-Party Services",
    content:
      "We use a small number of carefully selected third-party service providers to operate SpineLab. The complete list is below.",
    subsections: [
      {
        subtitle: "Supabase",
        bullets: [
          "Provides our backend infrastructure: authentication, database, and storage for your account, posture scans, and progress data",
          "Data is stored on Supabase's secure cloud infrastructure",
          "Supabase processes your data only on our behalf to provide app functionality",
        ],
      },
      {
        subtitle: "Google (MediaPipe & CDN)",
        bullets: [
          "Hosts the MediaPipe pose detection model file and WebAssembly runtime, which your device downloads once and then runs locally",
          "We do not send your photos, video, or personal information to Google",
          "The only Google interaction is the one-time download of the AI model files",
        ],
      },
      {
        subtitle: "Apple",
        bullets: [
          "Limited App Store analytics, governed by your iOS device's privacy settings",
        ],
      },
    ],
    footer:
      "We do not authorize any third-party provider to use your personal data for their own advertising purposes. We do not sell your data, and we do not share it with data brokers.",
  },
  {
    title: "6. Your AI Consent & Controls",
    content:
      "Because SpineLab uses an AI model and stores scan photos in your account, we ask for your explicit consent before your first posture scan.",
    bullets: [
      "Before your first scan, the App shows a dedicated consent screen titled 'How posture scanning works' that summarizes what data is collected, where it is stored, and what we never do with it",
      "The camera does not open until you tap 'I agree — continue to scan' on that screen",
      "Your consent is recorded in your account with a timestamp",
      "You can revoke AI scanning consent anytime from Account → AI Posture Scanning. Revoking disables future scans but does not delete your existing data",
      "You can delete any individual scan from your scan history, and you can delete your account entirely from Account → Delete Account",
    ],
  },
  {
    title: "7. Data Storage & Security",
    content:
      "We use reasonable administrative, technical, and organizational safeguards designed to protect your information.",
    bullets: [
      "Encrypted transmission where appropriate",
      "Authenticated account access controls",
      "Secure cloud-based infrastructure and storage",
      "Reasonable efforts to limit unauthorized access",
    ],
    footer:
      "No system is completely secure, and we cannot guarantee absolute security of your information.",
  },
  {
    title: "8. Data Retention",
    content:
      "We retain data for as long as reasonably necessary to provide the App, maintain your account, comply with legal obligations, resolve disputes, and enforce our agreements.",
    bullets: [
      "Account information is retained while your account remains active",
      "Posture images and progress history are retained until you delete them or delete your account",
      "When you delete your account, your data is removed within a commercially reasonable timeframe (typically within 30 days), unless retention is required by law",
    ],
  },
  {
    title: "9. Your Choices & Rights",
    content:
      "You can review, update, reset, or delete your information at any time through the App.",
    bullets: [
      "Update onboarding responses and plan preferences from Account → Update My Plan",
      "Delete posture images from your scan history",
      "Reset all progress from Account → Reset Progress",
      "Revoke AI scanning consent from Account → AI Posture Scanning",
      "Delete your entire account from Account → Delete Account",
      "Request additional data access, export, or deletion by emailing support@spinelab.app",
    ],
    footer:
      "If you are in the EU, UK, or California, you have additional rights under GDPR, UK GDPR, and CCPA — including the right to object to processing and the right to data portability.",
  },
  {
    title: "10. HIPAA & Health Information Notice",
    content:
      "SpineLab is a wellness application and is not a hospital, clinic, medical practice, health plan, or other HIPAA-covered entity.",
    bullets: [
      "SpineLab is not intended to receive or store medical records",
      "Information you enter into SpineLab may not be protected health information under HIPAA",
      "Do not upload medical records, diagnostic imaging, or highly sensitive health documents into the App",
    ],
  },
  {
    title: "11. Children's Privacy",
    content:
      "SpineLab is intended for adults and is not directed to children under 18. We do not knowingly collect personal information from children under 18.",
  },
  {
    title: "12. Changes to This Privacy Policy",
    content:
      "We may update this Privacy Policy from time to time. When we do, we will revise the 'Last Updated' date at the top of this page. Your continued use of SpineLab after changes are posted means you accept the updated policy.",
  },
  {
    title: "13. Contact Us",
    content:
      "If you have questions or requests related to privacy, data, or this Privacy Policy, please use the contact method below.",
    bullets: [
      "Support email: support@spinelab.app",
      "If that email is not yet active, you may use any in-app support pathway we make available",
    ],
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-sm font-bold tracking-tight">Privacy Policy</h1>
      </div>

      <div className="mx-auto max-w-lg px-6 pb-20 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">
                Privacy Policy
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Last Updated: May 16, 2026
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
            <p className="text-sm leading-relaxed text-foreground/80">
              Your privacy matters to SpineLab. We aim to collect only what we need
              to operate the App, provide posture and wellness features, and
              improve the experience over time.
            </p>
          </div>

          <div className="space-y-7">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 pb-7 last:border-0 last:pb-0"
              >
                <h3 className="mb-2.5 text-sm font-bold text-foreground">
                  {section.title}
                </h3>

                {section.content && (
                  <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                    {section.content}
                  </p>
                )}

                {section.subsections?.map((sub) => (
                  <div key={sub.subtitle} className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      {sub.subtitle}
                    </p>
                    <ul className="space-y-2">
                      {sub.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/70"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {section.bullets && (
                  <ul className="mb-3 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/70"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.footer && (
                  <p className="rounded-xl bg-secondary/60 px-3 py-2.5 text-xs font-medium leading-relaxed text-foreground/60">
                    {section.footer}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-10 border-t border-border/50 pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SpineLab · All rights reserved
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Support:{" "}
              <a
                href="mailto:support@spinelab.app"
                className="text-primary underline underline-offset-2"
              >
                support@spinelab.app
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
