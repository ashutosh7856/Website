import { useAuthStore } from "@/store/AuthStore";
import { ArrowRight, Download, User2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { downloadReport } from "@/api/psychometric";

interface UserDetailsProps {
    onEditClick: () => void;
}

export default function UserDetails({ onEditClick }: UserDetailsProps) {
    const { user } = useAuthStore();
    // Comes in on the login/profile response — no extra call.
    const reportLink = user?.pyschometricReportPdfLink;

    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'User';
    const displayRole = user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
        : 'Student';
    const photoUrl = user?.photo || user?.photoSmall;

    const data = [
        { title: 'Mobile Number', value: user?.phoneNumber || 'Not available' },
        { title: 'Email', value: user?.email || 'Not available' },
        { title: 'College', value: user?.collegeName || 'Add your college', action: !user?.collegeName },
    ];

    return (
        <div className="relative flex min-h-153.75 w-62 flex-col gap-6 rounded-2xl bg-white p-6">
            <div className="absolute right-4 top-4">
                <button
                    type="button"
                    onClick={onEditClick}
                    className="p-1 hover:cursor-pointer"
                    aria-label="Edit profile"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M7 7H6C5.46957 7 4.96086 7.21071 4.58579 7.58579C4.21071 7.96086 4 8.46957 4 9V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H15C15.5304 20 16.0391 19.7893 16.4142 19.4142C16.7893 19.0391 17 18.5304 17 18V17"
                            stroke="#2F43F2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M20.385 6.58511C20.7788 6.19126 21.0001 5.65709 21.0001 5.10011C21.0001 4.54312 20.7788 4.00895 20.385 3.61511C19.9912 3.22126 19.457 3 18.9 3C18.343 3 17.8088 3.22126 17.415 3.61511L9 12.0001V15.0001H12L20.385 6.58511Z"
                            stroke="#2F43F2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M16 5L19 8"
                            stroke="#2F43F2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <div className="flex flex-col gap-1 items-center justify-center">
                {photoUrl ? (
                    <img loading="lazy" decoding="async"
                    src={photoUrl}
                    alt="user_image"
                    className="rounded-full w-25 h-25 object-cover"
                />
                ):(
                   <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50">
                     <User2Icon/>
                   </div>
                )

                }
                <h2 className="flex flex-col text-(--text-main) font-semibold text-xl">
                    {displayName}
                    <span className="text-(--text-muted) font-normal text-[1rem]">
                        {displayRole === 'Counselor' ? 'Counsellor' : `${displayRole} Student`}
                    </span>
                </h2>
            </div>

            <div>
                {data.map((item) => (
                    <h3
                        key={item.title}
                        className="flex min-w-0 flex-col items-start gap-3 font-medium text-[1rem] text-(--text-main) py-[0.94rem] border-t border-[#E5E5E5]"
                    >
                        {item.title}
                        {item.action ? (
                            <button type="button" className="max-w-full break-words text-left text-[0.82rem] leading-relaxed font-medium text-[#2F43F2]" onClick={onEditClick}>
                                {item.value}
                            </button>
                        ) : (
                            <span className="max-w-full break-words text-left text-[0.82rem] leading-relaxed font-medium text-(--text-muted)">{item.value}</span>
                        )}
                    </h3>
                ))}

                {/* Mettle career test — the saved report if they own one, the
                    test itself if they don't. */}
                <div className="pt-[0.94rem] border-t border-[#E5E5E5]">
                    {reportLink ? (
                        <div
                            className="rounded-2xl p-4 text-left"
                            style={{ background: 'linear-gradient(140deg, #241A5E 0%, #4F46E5 55%, #7C3AED 100%)' }}
                        >
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/70">
                                Mettle
                            </p>
                            <p className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-white">
                                Your career report is ready
                            </p>

                            <button
                                type="button"
                                onClick={() => void downloadReport(reportLink)}
                                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[0.85rem] font-bold text-[#3730A3] shadow-sm transition-transform hover:-translate-y-px hover:cursor-pointer"
                            >
                                <Download className="h-4 w-4" strokeWidth={2.5} />
                                Download PDF
                            </button>
                            <a
                                href={reportLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block text-center text-[0.78rem] font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline"
                            >
                                or view it in the browser
                            </a>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-[#E5E5E5] p-4 text-left">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                                Mettle
                            </p>
                            <p className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-(--text-main)">
                                AI career report
                            </p>
                            <p className="mt-1 text-[0.78rem] font-medium text-(--text-muted)">
                                100 questions, scored into your top career matches.
                            </p>
                            <Link
                                to="/mettle"
                                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1629] px-4 py-2.5 text-[0.85rem] font-bold text-white transition-colors hover:bg-[#2f43f2]"
                            >
                                Take the test
                                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <div></div>
        </div>
    );
}
