import ExamCard from './ExamCard';

const EXAMS_DATA = [
  {
    id: 1,
    title: "JEE Advanced 2026",
    tag: "National",
    image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "GATE 2026 (Graduate Aptitude Test)",
    tag: "PG Entrance",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "CEED (Common Entrance Exam for Design)",
    tag: "Design",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=2874&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "JAM (Joint Admission Test for Masters)",
    tag: "Science",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2940&auto=format&fit=crop"
  }
];

const ExamsTab = () => {
  return (
    <div className="w-full grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-[23px] md:justify-center">
      {EXAMS_DATA.map((exam) => (
        <ExamCard
          key={exam.id}
          title={exam.title}
          tag={exam.tag}
          image={exam.image}
          onViewDetails={() => {}}
        />
      ))}
    </div>
  );
};

export default ExamsTab;