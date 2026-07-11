import AdvantageCard from "./AdvantageCard";

const advantages = [
  {
    title: "Real Insider Perspective",
    description:
      "Connect with students already studying at your target college. Get honest, unfiltered insights about campus life, academics, and what admission really looks like from someone who's been through it.",
  },
  {
    title: "Know Before You Go",
    description:
      "Explore hostel life, faculty quality, extracurricular opportunities, and the true campus culture — straight from a ProBuddy who lives it every day. Make your college decision with complete confidence.",
  },
  {
    title: "Peer-to-Peer Admission Help",
    description:
      "ProBuddies have walked the same path you're on. They can guide you through entrance exam prep, document checklists, college interviews, and share tips that no brochure will ever tell you.",
  },
];

export default function AdvantageSection() {
  return (
    <div className="w-full py-6 md:py-10 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-5 flex flex-col gap-3 md:mb-8 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex shrink-0 items-start">
            <img loading="lazy" decoding="async" src="/icon.svg" alt="icon_avg" className="h-auto w-[112px] md:w-[138px]" />
          </div>

          <h1 className="max-w-3xl text-(--text-main) text-sm font-medium leading-6 md:text-2xl md:leading-9">
            Why connect with a ProBuddy? Real students, real college stories —
            get the honest inside view before you decide.
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {advantages.map((adv, i) => (
            <AdvantageCard key={i} {...adv} />
          ))}
        </div>
      </div>
    </div>
  );
}
