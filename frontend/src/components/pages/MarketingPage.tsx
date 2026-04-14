import Footer from "../core/Footer";
import Hero from "../core/Hero";
import { NavigationBar } from "../core/Navbar";
import { TestimonialsSection } from "../marketing/TestimonialsSection";
import { ValuePropsSection } from "../marketing/ValuePropsSection";
import { WorkflowSection } from "../marketing/WorkflowSection";

const MarketingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <main className="theme-page min-h-screen selection:bg-amber-500/30 transition-colors duration-500 overflow-x-hidden custom-scrollbar">
      <NavigationBar onGetStarted={onGetStarted} />

      <Hero onGetStarted={onGetStarted} />
      <WorkflowSection />
      <ValuePropsSection />
      <TestimonialsSection />
      <Footer />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 20px; transition: background 0.3s; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--app-accent-strong); }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-in { animation: fade-in 0.8s ease-out forwards; }
      `}</style>
    </main>
  );
};

export default MarketingPage;