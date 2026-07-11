import UserDetails from "@/components/Revamp/user-profile/UserDetails";
import UserTabs from "@/components/Revamp/user-profile/UserTabs";
import EditProfileModal from "@/components/student-dashboard/EditProfileModal";
import { updateUserProfile } from "@/api/user";
import { useAuthStore } from "@/store/AuthStore";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function UserProfile(){
    const navigate = useNavigate();
    const { user, userId, setUser, refreshUser } = useAuthStore();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                navigate('/dashboard-student');
            }
        };
        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    const handleUpdateProfile = async (updatedData: { firstName: string; lastName: string; email: string }) => {
        const token = localStorage.getItem("jwt");
        if (!userId || !token) {
            toast.error("Please log in again to update your profile.");
            return;
        }

        await updateUserProfile(userId, updatedData, token);
        const refreshedUser = await refreshUser(true);
        if (refreshedUser) {
            setUser(refreshedUser);
        }
        toast.success("Profile updated!");
    };

    return (
        <div
            className="min-h-screen"
            style={{
                background:
                    "linear-gradient(0deg, rgba(198, 221, 240, 0.25) 0%, rgba(198, 221, 240, 0.25) 100%), #FFF",
            }}
        >
            <div className="w-full border-b border-[#E3E8F4] bg-white">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <p className="text-[0.875rem] text-(--text-muted) font-medium">
                        <Link
                            to="/admissions"
                            className="hover:text-(--text-main) transition-colors"
                        >
                            Admission
                        </Link>
                        <span className="mx-1">{">"}</span>{" "}
                        <span className="text-(--text-main)">Profile</span>
                    </p>
                </div>
            </div>

            <section className="relative pt-6">
                <div
                    className="absolute top-0 left-0 w-full h-40 bg-center bg-cover"
                    style={{ backgroundImage: "url('/profilebg.webp')" }}
                    aria-hidden="true"
                />

                <div className="relative w-full mx-auto max-w-7xl px-4 flex flex-col md:flex-row justify-center items-center gap-6 text-center pb-12">
                    <UserDetails onEditClick={() => setIsEditProfileOpen(true)} />
                    <UserTabs/>
                </div>
            </section>

            {user && (
                <EditProfileModal
                    user={user}
                    isOpen={isEditProfileOpen}
                    onClose={() => setIsEditProfileOpen(false)}
                    onUpdate={handleUpdateProfile}
                    onUploadComplete={() => {
                        void refreshUser(true);
                    }}
                />
            )}
        </div>
    );
}