"use client";

import { Quote, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatarText: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "I was paying $12/month for Wispr Flow, but Cadence running local Whisper on my M3 Max is significantly faster and completely private. I dictate code comments and design docs all day.",
    author: "Alex Rivera",
    role: "Senior Staff Engineer",
    avatarText: "AR",
  },
  {
    quote:
      "Magic Edit is black magic. I select a messy bullet list of notes from a client call, hold Alt+X, say 'turn this into an action-item email', and it rewrites right in front of me.",
    author: "Elena Rostov",
    role: "Product Lead & Founder",
    avatarText: "ER",
  },
  {
    quote:
      "As an attorney dealing with confidential client briefs, cloud-based voice dictation was a compliance nightmare. Cadence with local MLX is the only tool our firm allows.",
    author: "David Chen",
    role: "Healthcare & IP Attorney",
    avatarText: "DC",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white/40 dark:bg-black/10 border-t border-[#E2DBD0] dark:border-[#2B2823] section-auto-visibility">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C15F3D]/10 text-[#C15F3D] text-xs font-mono font-medium mb-3">
            <Star className="w-3.5 h-3.5 fill-[#C15F3D]" />
            <span>Community Wall of Love</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1A1815] dark:text-[#EDE9DF]">
            Loved by builders, writers, and{" "}
            <span className="italic text-[#C15F3D]">speed thinkers</span>.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-5 sm:p-8 rounded-3xl bg-[#FAF7F2] dark:bg-[#1A1916] border border-[#E2DBD0] dark:border-[#2B2823] shadow-md flex flex-col justify-between"
            >
              <div>
                <Quote className="w-7 h-7 sm:w-8 sm:h-8 text-[#C15F3D]/30 mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-[#1A1815] dark:text-[#EDE9DF] leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2DBD0] dark:border-[#2B2823] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C15F3D]/15 text-[#C15F3D] flex items-center justify-center font-mono text-xs font-bold">
                  {t.avatarText}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1A1815] dark:text-[#EDE9DF]">
                    {t.author}
                  </div>
                  <div className="text-xs text-[#787368] dark:text-[#A19B8E] font-mono">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
