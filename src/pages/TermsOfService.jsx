import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Nature of the Service",
    content:
      "SpineLab is a wellness application that may provide posture analysis, movement insights, exercise suggestions, educational content, and progress tracking based on information you submit and features you choose to use. SpineLab is not a medical provider and does not provide medical advice, diagnosis, treatment, physical therapy services, or emergency care.",
  },
  {
    title: "2. Not Medical Advice",
    content:
      "All content and features within SpineLab are provided for general informational and wellness purposes only.",
    bullets: [
      "SpineLab is not a substitute for professional medical advice, diagnosis, or treatment",
      "You should consult a licensed healthcare professional before starting any new exercise, stretching, mobility, or wellness program",
      "You should seek prompt medical attention for pain, worsening symptoms, injury, numbness, weakness, dizziness, or any medical emergency",
    ],
    footer:
      "Do not make medical decisions based solely on SpineLab content, posture scores, or exercise suggestions.",
  },
  {
    title: "3. Exercise & Movement Risk",
    content:
      "By using SpineLab and performing any suggested exercise, movement, stretch, mobility routine, or wellness activity, you acknowledge and agree that physical activity carries inherent risk.",
    bullets: [
      "You participate voluntarily and at your own risk",
      "You are responsible for assessing whether any activity is appropriate for your body, condition, and current health status",
      "You will stop immediately if you experience pain, worsening symptoms, or any concerning reaction",
      "SpineLab's content is general in nature and may not be appropriate for your individual circumstances",
    ],
  },
  {
    title: "4. Posture Analysis Disclaimer",
    content:
      "SpineLab may use software-based posture analysis, automated computer vision, image processing, and algorithmic scoring.",
    bullets: [
      "Results may be incomplete, inaccurate, delayed, or incorrect",
      "Posture findings and Spine Scores are estimates only",
      "Posture analysis is not diagnostic and should not be relied upon as medical evaluation",
    ],
    footer:
      "You agree that SpineLab posture analysis is offered solely as a general wellness feature.",
  },
  {
    title: "5. No Guarantee of Results",
    content:
      "SpineLab does not guarantee any specific result, including improvement in posture, mobility, flexibility, pain, strength, function, or overall health. Outcomes vary by person and may depend on factors outside of SpineLab's control.",
  },
  {
    title: "6. User Responsibilities",
    content:
      "You agree to use SpineLab responsibly, lawfully, and in good faith.",
    bullets: [
      "Provide truthful and reasonably accurate information",
      "Use the App only for personal, non-commercial use unless we expressly permit otherwise",
      "Not misuse, disrupt, probe, scrape, reverse engineer, or interfere with the App or related infrastructure",
      "Not upload content you do not have the right to use or share",
      "Not use the App in a way that could harm SpineLab, other users, or third parties",
    ],
  },
  {
    title: "7. Accounts & Security",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials and for activity that occurs under your account.",
    bullets: [
      "Keep your login credentials secure",
      "Use the App only through authorized access methods",
      "Notify us through available support channels if you believe your account has been compromised",
    ],
    footer:
      "To the maximum extent permitted by law, SpineLab is not responsible for losses arising from unauthorized access caused by your failure to safeguard your account.",
  },
  {
    title: "8. Third-Party Services",
    content:
      "SpineLab may rely on third-party providers to support functionality such as hosting, infrastructure, authentication, storage, analytics, and database services.",
    bullets: [
      "This may include providers such as Supabase",
      "Your use of certain features may depend on third-party systems outside our direct control",
      "We are not responsible for outages, interruptions, or failures caused by third-party providers",
    ],
  },
  {
    title: "9. Limitation of Liability",
    content:
      "To the fullest extent permitted by applicable law, SpineLab and its owners, operators, affiliates, licensors, contractors, and service providers will not be liable for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising out of or related to your use of the App.",
    bullets: [
      "Injury, pain, aggravation of symptoms, or health complications",
      "Reliance on posture analysis, Spine Scores, or exercise suggestions",
      "Interrupted service, technical failures, or feature unavailability",
      "Loss of data, business interruption, or device issues",
    ],
    footer: "Your use of SpineLab is at your own risk.",
  },
  {
    title: "10. Release of Claims",
    content:
      "To the extent permitted by law, you release and hold harmless SpineLab and its related parties from claims, demands, damages, and liabilities arising from your participation in exercises, use of posture analysis features, reliance on App content, or misuse of the App.",
  },
  {
    title: "11. Intellectual Property",
    content:
      "All SpineLab content, branding, software, visual design, text, graphics, routines, posture logic, scoring methods, and related materials are owned by SpineLab or its licensors and are protected by applicable intellectual property laws.",
    bullets: [
      "You may not copy, reproduce, distribute, modify, republish, sell, or exploit SpineLab content except as expressly permitted",
      "No license or ownership right is transferred to you except the limited right to use the App in accordance with these Terms",
    ],
  },
  {
    title: "12. Account Suspension or Termination",
    content:
      "We may suspend, restrict, or terminate access to SpineLab at any time, with or without notice, if we believe you violated these Terms, created risk, misused the App, or engaged in harmful, abusive, fraudulent, or unlawful conduct.",
  },
  {
    title: "13. Changes to the Service or Terms",
    content:
      "We may modify, suspend, or discontinue any part of SpineLab at any time. We may also update these Terms from time to time. When we do, we will revise the 'Last Updated' date above. Your continued use of SpineLab after updated Terms are posted constitutes acceptance of the revised Terms.",
  },
  {
    title: "14. Governing Law",
    content:
      "These Terms are governed by the laws of the United States and the State of Texas, without regard to conflict of law principles, except to the extent otherwise required by applicable law.",
  },
  {
    title: "15. Contact Us",
    content:
      "If you have questions, concerns, or feedback regarding these Terms, please use the contact method listed in the App.",
    bullets: [
      "Support email: support@spinelab.app",
      "If that email is not yet active, you may use any in-app support or account pathway we make available",
    ],
  },
];

export default function TermsOfService() {
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
        <h1 className="text-sm font-bold tracking-tight">Terms of Service</h1>
      </div>

      <div className="mx-auto max-w-lg px-6 pb-20 pt-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">Terms of Service</h2>
              <p className="mt-1 text-xs text-muted-foreground">Last Updated: April 9, 2026</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4">
            <p className="text-sm leading-relaxed text-foreground/80">
              By accessing or using SpineLab, you agree to these Terms of Service. If you do not
              agree, do not use the App.
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