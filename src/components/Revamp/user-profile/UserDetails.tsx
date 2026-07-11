import { useAuthStore } from "@/store/AuthStore";
import { User2Icon } from "lucide-react";

interface UserDetailsProps {
    onEditClick: () => void;
}

export default function UserDetails({ onEditClick }: UserDetailsProps) {
    const { user } = useAuthStore();

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
    ];

    return (
        <div className="relative flex flex-col gap-6 bg-white w-62 h-153.75 p-6 rounded-2xl">
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
                        <span className="max-w-full break-all text-(--text-muted) font-medium">
                            {item.value}
                        </span>
                    </h3>
                ))}
            </div>

            <div></div>
        </div>
    );
}
