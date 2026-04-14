import { workflowItems } from "./marketingContent";
import { FeatureCard } from "../assets/FeatureCard";

export const WorkflowSection = () => (
  <section className="theme-surface-muted py-28 sm:py-44 px-6 sm:px-12 border-y border-[color:var(--app-border)] relative overflow-hidden transition-colors duration-500">
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <p className="theme-accent text-[11px] font-black uppercase tracking-[0.4em] mb-6 sm:mb-8">
        Workflow Engine
      </p>
      <h2 className="theme-title text-4xl sm:text-7xl font-black mb-14 sm:mb-24 tracking-tighter uppercase leading-none">
        Measure. <span className="theme-accent italic">Estimate.</span>{" "}
        Certify.
      </h2>

      <div className="grid lg:grid-cols-3 gap-8 sm:gap-10">
        {workflowItems.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  </section>
);
