import {
  CheckCircle,
  Cpu,
  DollarSign,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  Tablet,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface MarketingCardItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TestimonialItem {
  quote: string;
  initials: string;
  name: string;
  role: string;
  avatarClassName?: string;
}

export const heroPhrases = [
  "Precision Cost Control.",
  "Automated BoQ Systems.",
  "Site Progress Tracking.",
  "Offline Daily Records.",
];

export const workflowItems: MarketingCardItem[] = [
  {
    icon: Tablet,
    title: "1. Site Takeoff",
    description:
      "Capture quantities directly on drawings. Local device encryption keeps records secure even on low-signal sites.",
  },
  {
    icon: LayoutGrid,
    title: "2. Automated BoQ",
    description:
      "Generate compliant Bills of Quantities instantly with built-in templates for concrete, walling, and civil works.",
  },
  {
    icon: DollarSign,
    title: "3. Payment Certs",
    description:
      "Calculate monthly progress claims automatically and produce polished interim certificates for fast sharing.",
  },
];

export const valuePropItems: MarketingCardItem[] = [
  {
    icon: Zap,
    title: "Offline-First Logic",
    description:
      "Your records stay safe locally and sync the moment your device reconnects to the cloud.",
  },
  {
    icon: MapPin,
    title: "Localized SMM Rules",
    description:
      "Aligned with East African measurement standards, so teams spend less time checking compliance manually.",
  },
  {
    icon: TrendingUp,
    title: "Project Analytics",
    description:
      "Track productivity, materials, and site performance with sharper operational visibility.",
  },
  {
    icon: LayoutGrid,
    title: "Digital Diary",
    description:
      "Maintain an auditable log of events, weather, deliveries, and progress tied to cost nodes.",
  },
  {
    icon: CheckCircle,
    title: "Professional Reports",
    description:
      "Export valuation reports, BoQs, and variation claims in clean PDF and Excel-ready formats.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Security",
    description:
      "AES-256 local encryption and resilient backups protect sensitive project information.",
  },
];

export const testimonials: TestimonialItem[] = [
  {
    quote:
      '"QS Vault is the only tool that actually understands site work. The offline logic is absolutely bulletproof for remote projects."',
    initials: "DD",
    name: "Denzel Damba",
    role: "Principal QS / Centum RE",
    avatarClassName:
      "bg-amber-500 text-black shadow-xl shadow-amber-500/20",
  },
  {
    quote:
      '"Payment certificates used to take weeks of coordination. Now, we close our monthly valuation cycles in just a few days."',
    initials: "NM",
    name: "Naff Mwaura",
    role: "Project Manager",
    avatarClassName: "theme-avatar-neutral border shadow-xl",
  },
];

export const heroEyebrow = {
  icon: Cpu,
  label: "The Digital Infrastructure for Construction",
};
