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
    title: "3. Posture Analysis & AI Disclaimer",
    content:
      "SpineLab uses automated computer vision, software logic, and algorithmic scoring to analyze posture images and generate wellness insights.",
    bullets: [
      "Posture analysis results are estimates only",
      "Results may be incomplete, inaccurate, or not medically precise",
      "Spine Scores, posture findings, and movement insights are provided for general wellness and educational purposes only",
      "SpineLab does not provide medical advice, medical diagnosis, or treatment",
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
      "We use carefully selected third-party service providers to help operate SpineLab. These providers may support hosting, infrastructure, analytics, authentication, and secure data storage.",
    bullets: [
      "We use Supabase for services such as authentication, database functionality, and file or data storage",
      "These providers may process account information, posture scan data, progress data, and questionnaire responses on our behalf",
      "Third-party providers are used only to help us operate and improve the App",
    ],
    footer:
      "We do not authorize third-party providers to use your personal data for their own advertising purposes.",
  },
  {
    title: "6. Data Storage & Security",
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
    title: "7. Data Retention",
    content:
      "We retain data for as long as reasonably necessary to provide the App, maintain your account, comply with legal obligations, resolve disputes, and enforce our agreements.",
    bullets: [
      "Account information may be retained while your account remains active",
      "Posture images, progress history, and questionnaire data may be retained to support your ongoing experience",
      "When account deletion functionality is made available or when we honor a valid deletion request, we will remove or de-identify applicable data within a commercially reasonable timeframe, unless retention is required by law",
    ],
  },
  {
    title: "8. Your Choices & Rights",
    content:
      "Depending on how SpineLab features are configured, you may be able to review, update, reset, or delete certain information through the App.",
    bullets: [
      "Update onboarding responses and plan preferences",
      "Delete posture images if that functionality is available in the App",
      "Reset certain progress or routine settings if that functionality is available in the App",
      "Request account or data deletion through the Account section or a support contact method we provide",
    ],
    footer:
      "If an in-app option is not yet available, you may use the support contact method listed in the App once activated.",
  },
  {
    title: "9. HIPAA & Health Information Notice",
    content:
      "SpineLab is a wellness application and is not a hospital, clinic, medical practice, health plan, or other HIPAA-covered entity.",
    bullets: [
      "SpineLab is not intended to receive or store medical records",
      "Information you enter into SpineLab may not be protected health information under HIPAA",
      "Do not upload medical records, diagnostic imaging, or highly sensitive health documents into the App",
    ],
  },
  {
    title: "10. Children's Privacy",
    content:
      "SpineLab is intended for adults and is not directed to children under 18. We do not knowingly collect personal information from children under 18.",
  },
  {
    title: "11. Changes to This Privacy Policy",
    content:
      "We may update this Privacy Policy from time to time. When we do, we will revise the 'Last Updated' date at the top of this page. Your continued use of SpineLab after changes are posted means you accept the updated policy.",
  },
  {
    title: "12. Contact Us",
    content:
      "If you have questions or requests related to privacy, data, or this Privacy Policy, please use the contact method listed in the App.",
    bullets: [
      "Support email: support@spinelab.app",
      "If that email is not yet active, you may use the Account section or any in-app support pathway we make available",
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
              <h2 className="text-xl font-bold leading-tight tracking-tight">Privacy Policy</h2>
              <p className="mt-1 text-xs text-muted-foreground">Last Updated: April 9, 2026</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
            <p className="text-sm leading-relaxed text-foreground/80">
              Your privacy matters to SpineLab. We aim to collect only what we need to operate the
              App, provide posture and wellness features, and improve the experience over time.
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
                <h3 className="mb-2.5 text-sm font-bold text-foreground">{section.title}</h3>

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