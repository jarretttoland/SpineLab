import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Nature of the Service",
    content:
      "SpineLab is a wellness application that provides posture analysis, general health insights, and exercise recommendations based on information you provide and optional photo analysis. SpineLab is designed to support your wellness journey — it is not a medical provider and does not deliver medical advice, clinical diagnosis, or treatment of any kind.",
  },
  {
    title: "2. Not a Substitute for Medical Care",
    content:
      "All content within SpineLab — including Spine Scores, posture findings, and exercise suggestions — is for educational and informational purposes only. By using the App you agree:",
    bullets: [
      "Not to rely on SpineLab as a substitute for professional medical advice, diagnosis, or treatment",
      "To always consult a licensed healthcare provider before beginning any new exercise or rehabilitation program",
      "To seek immediate professional care if you experience pain, worsening symptoms, or a medical emergency",
    ],
  },
  {
    title: "3. Acceptable Use",
    content: "You agree to use the App responsibly and in good faith. Specifically, you agree to:",
    bullets: [
      "Provide accurate, truthful information during onboarding and use",
      "Use the App for personal, non-commercial purposes only",
      "Not attempt to reverse-engineer, hack, scrape, or interfere with the App or its infrastructure",
    ],
    footer:
      "SpineLab reserves the right to suspend or terminate accounts that violate these Terms without prior notice.",
  },
  {
    title: "4. User Accounts & Security",
    content:
      "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. SpineLab is not liable for unauthorized access resulting from your failure to secure your account information. If you suspect unauthorized use of your account, contact us immediately at support@spinelab.app.",
  },
  {
    title: "5. Assumption of Risk",
    content:
      "Physical activity carries inherent risks. By using SpineLab and following any recommendations or exercise suggestions, you acknowledge that:",
    bullets: [
      "You are voluntarily participating in physical activities at your own risk",
      "You are responsible for assessing your own fitness level and ability",
      "SpineLab's recommendations are general in nature and may not be appropriate for your individual circumstances",
    ],
  },
  {
    title: "6. Limitation of Liability",
    content:
      "To the maximum extent permitted by applicable law, SpineLab, its founders, and its affiliates shall not be liable for:",
    bullets: [
      "Any physical injury, pain, or health complications resulting from use of the App",
      "Any decisions made based on SpineLab's insights or recommendations",
      "Any indirect, incidental, special, or consequential damages",
      "Any loss of data or service interruptions",
    ],
    footer: "Use of SpineLab is at your own risk.",
  },
  {
    title: "7. Intellectual Property",
    content:
      "All content, design, code, and algorithms within the App are the intellectual property of SpineLab. You may not reproduce, distribute, or create derivative works from any part of the App without explicit written permission.",
  },
  {
    title: "8. Modifications to Terms",
    content:
      "We may update these Terms from time to time. When we do, we will revise the 'Last updated' date above. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms. We encourage you to review this page periodically.",
  },
  {
    title: "9. Governing Law",
    content:
      "These Terms are governed by and construed in accordance with the laws of the United States and the State of Texas, without regard to conflict of law principles.",
  },
  {
    title: "10. Contact Us",
    content:
      "If you have questions, concerns, or feedback about these Terms, please reach out to us at:\n\nsupport@spinelab.app",
  },
];

export default function TermsOfService() {
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
        <h1 className="text-sm font-bold tracking-tight">Terms of Service</h1>
      </div>

      <div className="px-6 pt-8 pb-20 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {/* Hero */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight leading-tight">Terms of Service</h2>
              <p className="text-xs text-muted-foreground mt-1">Last updated: March 27, 2025</p>
            </div>
          </div>

          {/* Intro card */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4 mb-8">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Welcome to SpineLab. By accessing or using the App, you agree to these Terms. Please read them carefully. If you do not agree, please do not use the App.
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