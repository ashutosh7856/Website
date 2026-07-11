import CourseCard from './CourseCard';

const COURSES = [
  {
    id: 1,
    title: "B.Tech in Computer Science & Engg",
    category: "UG" as const,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "M.Tech in Artificial Intelligence",
    category: "PG" as const,
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "MBA in Technology Management",
    category: "PG" as const,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "B.Tech in Mechanical Engineering",
    category: "UG" as const,
    image: "https://plus.unsplash.com/premium_photo-1664910842853-0d643f6db30c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWVjaGFuaWNhbCUyMGVuZ2luZWVyaW5nfGVufDB8fDB8fHww"
  }
];

const CoursesTab = () => {
  return (
    // Mobile: Grid with 2 columns. Desktop: Flex wrap (preserved)
    <div className="w-full grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-[23px] md:justify-center">
      {COURSES.map((course) => (
        <CourseCard
          key={course.id}
          title={course.title}
          category={course.category}
          image={course.image}
          onViewCourse={() => {}}
        />
      ))}
    </div>
  );
};

export default CoursesTab;