import { valuePropItems } from "./marketingContent";
import { ValuePropCard } from "../assets/ValuePropCard";

export const ValuePropsSection = () => (
  <section className="py-28 sm:py-44 px-6 sm:px-12 bg-transparent">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 sm:gap-16 mb-14 sm:mb-24 text-left">
        <div className="max-w-4xl">
          <p className="text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-[0.4em] mb-5">
            Precision Layer
          </p>
          <h2 className="theme-title text-4xl sm:text-6xl font-black tracking-tight mb-6 sm:mb-8 uppercase leading-[1.05]">
            Engineering-Grade Precision,
            <br className="hidden lg:block" /> Built for the Site Node.
          </h2>
          <p className="theme-subtle text-lg sm:text-2xl font-medium leading-relaxed">
            Modern construction demands fast, dependable visibility. We have
            removed the friction of legacy software to keep teams focused on
            clean data and confident delivery.
          </p>
        </div>

        <div className="theme-surface-accent w-full lg:w-auto border px-8 py-8 sm:px-10 sm:py-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl transition-colors">
          <p className="text-[12px] font-black uppercase tracking-[0.35em] text-amber-600 dark:text-amber-400 mb-3 leading-none">
            Compliance Protocol
          </p>
          <p className="theme-title text-2xl sm:text-4xl font-black italic leading-tight">
            SMM-KE / RICS 2026
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {valuePropItems.map((item) => (
          <ValuePropCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  </section>
);
