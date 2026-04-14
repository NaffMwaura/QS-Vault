import GlassCard from "../ui/GlassCard";
import { testimonials } from "./marketingContent";

export const TestimonialsSection = () => (
  <section className="theme-page py-28 sm:py-44 px-6 sm:px-12 overflow-hidden relative transition-colors duration-500">
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <p className="theme-accent text-[11px] font-black uppercase tracking-[0.4em] mb-6 sm:mb-8">
        Trusted Teams
      </p>
      <h2 className="theme-title text-4xl sm:text-7xl font-black uppercase tracking-tighter mb-14 sm:mb-24 italic leading-none">
        Authorized by <span className="theme-accent">Industry</span>
        <br className="hidden sm:block" /> Professionals.
      </h2>

      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 text-left">
        {testimonials.map((testimonial) => (
          <GlassCard
            key={testimonial.name}
            className="p-8 sm:p-12 border shadow-2xl flex flex-col justify-between h-full"
          >
            <p className="theme-subtle font-medium italic mb-8 sm:mb-10 leading-relaxed text-lg sm:text-2xl">
              {testimonial.quote}
            </p>
            <div className="flex items-center gap-5 mt-auto">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 italic ${testimonial.avatarClassName ?? ""}`}
              >
                {testimonial.initials}
              </div>
              <div>
                <p className="theme-title font-black text-sm uppercase tracking-[0.2em]">
                  {testimonial.name}
                </p>
                <p className="theme-subtle text-[11px] uppercase tracking-[0.2em] mt-1 font-bold">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  </section>
);
