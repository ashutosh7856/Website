import type { CourseType } from "@/types/course";
import { Bookmark } from "lucide-react";
import { bookmarkCourse } from "@/api/course";
import toast from "react-hot-toast";
import { useState } from "react";

interface propsType {
  course: CourseType;
  role: "user" | "student" | "counselor" | "proBuddy";
  userId?: string | null;
  showBookmark?: boolean;
  isPublished?: boolean;
}

export default function CourseCard({
  course,
  role,
  userId,
  showBookmark = false,
  isPublished,
}: propsType) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState<boolean>(
    course.isBookmarked ?? false
  );

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to bookmark courses");
      return;
    }

    if (loading) return;

    setLoading(true);
    const toastId = toast.loading(
      bookmarked ? "Removing bookmark..." : "Adding bookmark..."
    );

    try {
      await bookmarkCourse({ userId, courseId: course.id });
      setBookmarked(prev => !prev);
      toast.success(
        bookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        { id: toastId }
      );
    } catch {
      toast.error("Failed to update bookmark", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        relative flex flex-col gap-3
        w-full max-w-56
        h-[280px]
        p-3
        border border-[#efefef]
        rounded-[0.75rem]
        bg-white
      "
    >
      {/* IMAGE WRAPPER (fixed size, no shift) */}
      <div className="relative w-full h-32 rounded-md overflow-hidden bg-gray-100">
        <img
          src={course.image}
          alt={course.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Published/Draft Badge for counselor */}
        {role === "counselor" && isPublished !== undefined && (
          <span className={`absolute left-2 top-2 text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm ${isPublished ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        )}

        {showBookmark && (role === "user" || role === "student") && (
          <button
            onClick={handleBookmarkClick}
            disabled={loading}
            aria-label="Bookmark course"
            className="
              absolute right-2 top-2
              flex h-8 w-8 items-center justify-center
              rounded-full bg-black/30 backdrop-blur-md
              transition-colors hover:bg-black/50
              hover:cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Bookmark
              className={`h-4 w-4 text-white ${bookmarked ? "fill-current" : ""
                }`}
            />
          </button>
        )}
      </div>

      {/* CATEGORY */}
      <p className="text-xs font-medium text-[#718EBF] uppercase">
        Course
      </p>

      {/* TITLE — ONE LINE ONLY */}
      <h1
        className="
          text-[#242645]
          font-semibold
          text-[0.95rem]
          truncate
        "
        title={course.name}
      >
        {course.name}
      </h1>

      {/* PRICE */}
      <div className="mt-auto flex items-center gap-1">
        <img loading="lazy" decoding="async" src="/coin.svg" alt="" className="w-4 h-4" />
        <span
          className="
            font-semibold
            text-[0.95rem]
            bg-clip-text text-transparent
            bg-gradient-to-r from-[#072EB1] to-[#03134B]
          "
        >
          {course.price} Procoins
        </span>
      </div>
    </div>
  );
}
