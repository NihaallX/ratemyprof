import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Accurate Ratings",
      description:
        "Verified student reviews with detailed breakdowns of teaching quality, difficulty level, and more.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Easy Discovery",
      description:
        "Find professors by name, college, department, or subject. Filter by rating and teaching style.",
      icon: <IconEaseInOut />,
    },
    {
      title: "Community Driven",
      description:
        "Join thousands of students helping each other make better academic decisions.",
      icon: <IconHeart />,
    },
    {
      title: "Detailed Analytics",
      description: "View comprehensive statistics including grade distributions, course difficulty, and student success rates.",
      icon: <IconCloud />,
    },
    {
      title: "Anonymous Reviews",
      description: "Share your honest feedback anonymously while maintaining accountability through verified accounts.",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "Real-Time Updates",
      description:
        "Get instant notifications about new reviews for your professors and stay informed.",
      icon: <IconHelp />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-white/10",
        (index === 0 || index === 3) && "lg:border-l border-white/10",
        index < 3 && "lg:border-b border-white/10"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-indigo-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gray-700 group-hover/feature:bg-indigo-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-gray-400 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
