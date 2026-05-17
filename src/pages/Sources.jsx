// FILE: src/pages/Sources.jsx
// NEW FILE. Save to: src/pages/Sources.jsx
//
// Add this route in App.jsx (inside ProtectedAppRoutes' Layout block):
//   <Route path="/sources" element={<Sources />} />
//
// Add a link to it from your Account page and from the Scan Results screen.
// (See the snippets in the resubmit guide.)
//
// Apple's 1.4.1 rejection asks for citations of medical information.
// This page provides peer-reviewed sources for every claim and metric
// used in SpineLab, with a clear disclaimer that the app is a wellness
// tracker, not a medical device.

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

const CITATIONS = [
  {
    topic: "Forward head posture & neck pain",
    summary:
      "Forward head position is associated with increased neck and shoulder pain and changes to cervical mechanics. SpineLab's forward head finding is based on the angular relationship between the ear and shoulder landmarks.",
    refs: [
      {
        text: "Kim D, Cho M, Park Y, Yang Y. Effect of an exercise program for posture correction on musculoskeletal pain. J Phys Ther Sci. 2015;27(6):1791-1794.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26180319/",
      },
      {
        text: "Mahmoud NF, et al. The relationship between forward head posture and neck pain: a systematic review and meta-analysis. Curr Rev Musculoskelet Med. 2019;12(4):562-577.",
        url: "https://pubmed.ncbi.nlm.nih.gov/31773477/",
      },
    ],
  },
  {
    topic: "Rounded shoulders & thoracic mechanics",
    summary:
      "Protracted (rounded) shoulder position alters scapular kinematics and is associated with upper-quarter pain and dysfunction. SpineLab assesses shoulder position relative to the ear and torso.",
    refs: [
      {
        text: "Singla D, Veqar Z. Association between forward head, rounded shoulders, and increased thoracic kyphosis: a review. J Chiropr Med. 2017;16(3):220-229.",
        url: "https://pubmed.ncbi.nlm.nih.gov/29097952/",
      },
      {
        text: "Lewis JS, Wright C, Green A. Subacromial impingement syndrome: the effect of changing posture on shoulder range of movement. J Orthop Sports Phys Ther. 2005;35(2):72-87.",
        url: "https://pubmed.ncbi.nlm.nih.gov/15773565/",
      },
    ],
  },
  {
    topic: "Thoracic & lumbar spine alignment",
    summary:
      "Sagittal spinal alignment correlates with quality of life, function, and pain. SpineLab uses angular measurements between shoulder, hip, and knee landmarks to characterize thoracic and lumbar tendencies.",
    refs: [
      {
        text: "Roussouly P, Pinheiro-Franco JL. Sagittal parameters of the spine: biomechanical approach. Eur Spine J. 2011;20(Suppl 5):578-585.",
        url: "https://pubmed.ncbi.nlm.nih.gov/21796394/",
      },
      {
        text: "McGill SM. Low Back Disorders: Evidence-Based Prevention and Rehabilitation. 3rd ed. Champaign, IL: Human Kinetics; 2015.",
        url: "https://us.humankinetics.com/products/low-back-disorders-3rd-edition",
      },
    ],
  },
  {
    topic: "Sedentary behavior & spinal health",
    summary:
      "Prolonged sitting is independently associated with back and neck symptoms. SpineLab's questionnaire captures daily sitting time as one input to your starting plan.",
    refs: [
      {
        text: "Lis AM, Black KM, Korn H, Nordin M. Association between sitting and occupational LBP. Eur Spine J. 2007;16(2):283-298.",
        url: "https://pubmed.ncbi.nlm.nih.gov/16736200/",
      },
    ],
  },
  {
    topic: "Daily movement & exercise for the spine",
    summary:
      "Regular, low-load movement and targeted exercise reduce back pain risk and improve function. SpineLab's daily routines focus on mobility, controlled strength, and breathing.",
    refs: [
      {
        text: "Steffens D, et al. Prevention of low back pain: a systematic review and meta-analysis. JAMA Intern Med. 2016;176(2):199-208.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26752509/",
      },
      {
        text: "Saragiotto BT, et al. Motor control exercise for chronic non-specific low-back pain. Cochrane Database Syst Rev. 2016;(1):CD012004.",
        url: "https://pubmed.ncbi.nlm.nih.gov/26742533/",
      },
    ],
  },
  {
    topic: "Computer vision posture assessment",
    summary:
      "Pose detection from a single 2D image is an active research area. The MediaPipe Pose Landmarker model used by SpineLab provides body landmark coordinates with documented accuracy for general body segmentation; SpineLab uses these coordinates as the basis for relative angle and offset calculations, not as a clinical measurement.",
    refs: [
      {
        text: "Bazarevsky V, et al. BlazePose: On-device Real-time Body Pose Tracking. arXiv:2006.10204. 2020.",
        url: "https://arxiv.org/abs/2006.10204",
      },
      {
        text: "Google MediaPipe Pose Landmarker — model card and documentation.",
        url: "https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker",
      },
    ],
  },
];

export default function Sources() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 pt-10 pb-12 flex flex-col">
      <div className="max-w-2xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-3 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          Methodology & Sources
        </p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight mb-3">
          The research behind SpineLab
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Every metric and recommendation in SpineLab is grounded in peer-reviewed
          research on posture, biomechanics, and movement. Here are the sources.
        </p>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 mb-10 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            <span className="font-semibold">Not medical advice.</span> SpineLab is
            a wellness tracking tool. The Spine Score, Spine Age, and posture
            findings are not diagnoses. If you are in pain or have a health
            concern, consult a qualified healthcare provider.
          </p>
        </div>

        <div className="space-y-10">
          {CITATIONS.map(({ topic, summary, refs }) => (
            <section key={topic}>
              <h2 className="text-lg font-bold tracking-tight text-foreground mb-2">
                {topic}
              </h2>
              <p className="text-[15px] text-foreground/80 leading-relaxed mb-4">
                {summary}
              </p>
              <ul className="space-y-3">
                {refs.map(({ text, url }, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <p className="text-sm text-foreground/85 leading-relaxed mb-2">
                      {text}
                    </p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                    >
                      View source
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
