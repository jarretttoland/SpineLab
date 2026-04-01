import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    title: "1. What We Collect",
    content: "We only collect what's needed to deliver your personalized experience.",
    subsections: [
      {
        subtitle: "Account Information",
        bullets: ["Your name (optional)", "Email address", "Login credentials (securely hashed)"],
      },
      {
        subtitle: "Health & Wellness Information",
        bullets: [
          "Pain location and type",
          "Activity level and daily habits",
          "Goals and questionnaire responses",
          "Your Spine Score and progress history",
        ],
      },
      {
        subtitle: "Photo Data",
        bullets: [
          "Posture images you voluntarily upload for AI analysis",
          "We do not capture photos without your explicit action",
        ],
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: "Your data is used exclusively to power your SpineLab experience. Specifically, we use it to:",
    bullets: [
      "Generate your personalized Spine Score and posture analysis",
      "Build and adapt your exercise and recovery program",
      "Track your consistency and progress over time",
      "Improve the accuracy and quality of the App",
    ],
    footer: "We do not use your data for advertising or behavioral profiling.",
  },
  {
    title: "3. Photo Privacy",
    content:
      "When you upload a posture photo, you explicitly consent to SpineLab analyzing that image to provide insights. We take photo privacy seriously:",
    bullets: [
      "We do not sell, rent, or transfer your images to third parties",
      "We do not use your images to train AI models without your separate consent",
      "Photos are encrypted in transit and at rest",
      "You can delete your photos at any time from your Account settings",
    ],
    footer:
      "We may use fully anonymized and de-identified aggregate data to improve our posture analysis algorithms.",
  },
  {
    title: "4. Data Storage & Security",
    content:
      "We use industry-standard encryption and security practices to protect your personal information. Your data is stored on secure, access-controlled infrastructure. While we take every reasonable precaution, no system can guarantee absolute security. We encourage you to use a strong, unique password for your account.",
  },
  {
    title: "5. Third-Party Services",
    content:
      "We do not sell your personal data. We may work with carefully selected third-party providers for services such as cloud hosting, analytics, and payment processing. These providers are contractually obligated to process your data only as directed by us and in compliance with applicable privacy laws.",
  },
  {
    title: "6. Your Rights & Choices",
    content: "You are in control of your data. You have the right to:",
    bullets: [
      "Access a copy of the data we hold about you",
      "Request correction of inaccurate information",
      "Request permanent deletion of your account and all associated data",
      "Withdraw consent for photo analysis at any time",
    ],
    footer: "To exercise any of these rights, contact us at support@spinelab.app.",
  },
  {
    title: "7. Data Retention",
    content:
      "We retain your data for as long as your account is active or as needed to provide services. If you delete your account, we will permanently remove your personal data within 30 days, except where retention is required by law.",
  },
  {
    title: "8. Children's Privacy",
    content:
      "SpineLab is intended for users aged 18 and older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has submitted data through our App, please contact us immediately.",
  },
  {
    title: "9. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of significant changes by updating the 'Last updated' date at the top of this page. Continued use of the App following any changes constitutes acceptance of the updated policy.",
  },
  {
    title: "10. Contact Us",
    content:
      "If you have any questions, concerns, or requests regarding your privacy or this policy, please contact us:\n\nsupport@spinelab.app",
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-sm font-bold tracking-tight">Privacy Policy</h1>
      </div>

      <div className="px-6 pt-8 pb-20 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Hero */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight leading-tight">Privacy Policy</h2>
              <p className="text-xs text-muted-foreground mt-1">Last updated: March 27, 2025</p>
            </div>
          </div>

          {/* Intro card */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4 mb-8">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Your privacy is fundamental to how SpineLab operates. We collect only what's necessary, we never sell your data, and you stay in control at all times.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-7">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 pb-7 last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-bold text-foreground mb-2.5">{section.title}</h3>
                {section.content && (
                  <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line mb-3">{section.content}</p>
                )}
                {section.subsections?.map((sub, j) => (
                  <div key={j} className="mb-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{sub.subtitle}</p>
                    <ul className="space-y-2">
                      {sub.bullets.map((b, k) => (
                        <li key={k} className="flex items-start gap-2.5 text-sm text-foreground/70 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {section.bullets && (
                  <ul className="space-y-2 mb-3">
                    {section.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/70 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {section.footer && (
                  <p className="text-xs font-medium text-foreground/60 leading-relaxed bg-secondary/60 rounded-xl px-3 py-2.5">
                    {section.footer}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SpineLab · All rights reserved
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Questions?{" "}
              <a href="mailto:support@spinelab.app" className="text-primary underline underline-offset-2">
                support@spinelab.app
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}