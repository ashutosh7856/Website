import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Loader2, Plus, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserById, getAllAppointmentsForSpecificUser, addNoteToSpecificUser, getCounselorProfileById } from '@/api/counselor-Dashboard';
import type { Client } from '@/types/client';
import toast from 'react-hot-toast';

interface LocationState {
    client: Client;
    counsellorId: string;
    token: string;
}

const TABS = ['Client Info', 'Appointments'];

const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(date);
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
    return `${day} ${month}, ${weekday}`;
};

const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10), parseInt(minute, 10));
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    }).format(date);
};

export default function ClientProfilePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState;
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<string>('Client Info');
    const [noteText, setNoteText] = useState('');
    const [isEditingNote, setIsEditingNote] = useState(false);

    if (!state || !state.client || !state.counsellorId || !state.token) {
        navigate('/counsellor-dashboard?tab=clients', { replace: true });
        return null;
    }

    const { client, counsellorId, token } = state;

    const {
        data: userDetail,
        isLoading: isLoadingUser
    } = useQuery({
        queryKey: ['clientUserDetail', counsellorId, client.id],
        queryFn: () => getUserById(counsellorId, client.id, token),
        enabled: !!counsellorId && !!client.id && !!token,
    });

    const {
        data: counselorData,
    } = useQuery({
        queryKey: ['counselorProfile', counsellorId],
        queryFn: () => getCounselorProfileById(counsellorId, token),
        enabled: !!counsellorId && !!userDetail,
    });

    const {
        data: appointments = [],
        isLoading: isLoadingAppointments
    } = useQuery({
        queryKey: ['clientAppointments', counsellorId, client.id],
        queryFn: () => getAllAppointmentsForSpecificUser(counsellorId, client.id, token),
        enabled: !!counsellorId && !!client.id && !!token && activeTab === 'Appointments',
    });

    const { mutate: saveNote, isPending: isSavingNote } = useMutation({
        mutationFn: () => addNoteToSpecificUser(counsellorId, client.id, noteText, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientUserDetail', counsellorId, client.id] });
            queryClient.invalidateQueries({ queryKey: ['counselorProfile', counsellorId] });
            setIsEditingNote(false);
            setNoteText('');
            toast.success('Note saved successfully');
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Failed to save note.');
        }
    });

    const handleSaveNote = () => {
        if (!noteText.trim()) {
            toast.error('Please enter a note');
            return;
        }
        saveNote();
    };

    const clientPlan = userDetail?.subscribedCounsellors?.find(
        (sub: any) => sub.counsellorId === counsellorId
    )?.plan || 'N/A';

    const clientNotes = counselorData?.notesForCounsellorRelatedToUser?.filter(
        (note: any) => note.userId === client.id
    ) || [];

    const formatPlanName = (plan: string) => {
        if (plan === 'plus') return 'Plus';
        if (plan === 'premium') return 'Premium';
        if (plan === 'elite') return 'Elite';
        if (plan === 'pro') return 'Pro';
        return plan;
    };

    const formatNoteDate = (timestamp: string | number) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusChip = (status: string) => {
        const chipClasses = "px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap";

        switch (status) {
            case 'completed':
                return <div className={`${chipClasses} bg-green-100 text-[#28A745]`}>Completed</div>;
            case 'cancelled':
                return <div className={`${chipClasses} bg-red-100 text-[#EE1C1F]`}>Cancelled</div>;
            default:
                return <div className={`${chipClasses} bg-[#E8E7F2] text-[#13097D]`}>Upcoming</div>;
        }
    };

    if (isLoadingUser) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-800" />
            </div>
        );
    }

    return (
        <div className="bg-[#F5F5F7] min-h-screen p-4 md:p-8 pt-15 md:pt-20">
            <div className="max-w-7xl mx-auto">

                {/* Profile Header - exactly matching StudentDashboard ProfileHeader */}
                <div className="md:mb-4 mb-1">
                    <div className="h-32 md:h-56 bg-gray-200 rounded-t-xl">
                        <img loading="lazy" decoding="async"
                            src="/imageClient.webp"
                            alt="Client Banner"
                            draggable={false}
                            className="w-full h-full object-cover rounded-t-xl"
                        />
                    </div>

                    <div className="px-4 md:px-10 pb-6">
                        <div className="relative flex flex-col items-center md:flex-row md:justify-between md:items-start">

                            <div className="flex flex-col md:flex-row items-center md:items-start w-full">
                                <div className="shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-gray-300 overflow-hidden shadow-lg -mt-16 md:-mt-24">
                                    <img loading="lazy" decoding="async"
                                        src={client.imageUrl}
                                        alt={client.name}
                                        draggable={false}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${client.name}&background=EBF4FF&color=0D47A1`; }}
                                    />
                                </div>

                                <div className="mt-4 md:mt-0 md:ml-6 md:pt-6 flex flex-col items-center md:items-start">
                                    <h1 className="text-xl md:text-2xl font-semibold text-[#343C6A] leading-tight">{client.name}</h1>
                                    <p className="text-sm md:text-lg text-[#718EBF] font-medium">{client.course}</p>

                                    {/* Mobile Plan Badge */}
                                    <div className="mt-3 md:hidden">
                                        {(() => {
                                            const plan = formatPlanName(clientPlan).toLowerCase();
                                            let gradient = '';
                                            let icon = '';

                                            if (plan === 'plus') {
                                                gradient = 'linear-gradient(90deg, #EA5C19 0%, #EB7B47 100%)';
                                                icon = '/plusClient.svg';
                                            } else if (plan === 'pro') {
                                                gradient = 'linear-gradient(95.99deg, #13097D 0.85%, #985573 79.34%)';
                                                icon = '/proClient.svg';
                                            } else if (plan === 'elite') {
                                                gradient = 'linear-gradient(0deg, #191276, #191276)';
                                                icon = '/eliteClient.svg';
                                            } else {
                                                gradient = 'linear-gradient(90deg, #718EBF 0%, #8C8CA1 100%)';
                                                icon = '';
                                            }

                                            return (
                                                <div
                                                    className="py-2 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2"
                                                    style={{ background: gradient }}
                                                >
                                                    {icon && (
                                                        <img loading="lazy" decoding="async" src={icon} alt={plan} className="w-5 h-5" />
                                                    )}
                                                    <span className="text-white font-semibold text-sm uppercase">
                                                        {formatPlanName(clientPlan)}
                                                    </span>
                                                    <span className="text-white text-xs font-medium">
                                                        Member
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden md:block md:pt-6">
                                {(() => {
                                    const plan = formatPlanName(clientPlan).toLowerCase();
                                    let gradient = '';
                                    let icon = '';

                                    if (plan === 'plus') {
                                        gradient = 'linear-gradient(90deg, #EA5C19 0%, #EB7B47 100%)';
                                        icon = '/plusClient.svg';
                                    } else if (plan === 'pro') {
                                        gradient = 'linear-gradient(95.99deg, #13097D 0.85%, #985573 79.34%)';
                                        icon = '/proClient.svg';
                                    } else if (plan === 'elite') {
                                        gradient = 'linear-gradient(0deg, #191276, #191276)';
                                        icon = '/eliteClient.svg';
                                    } else {
                                        gradient = 'linear-gradient(90deg, #718EBF 0%, #8C8CA1 100%)';
                                        icon = '';
                                    }

                                    return (
                                        <div
                                            className="py-3 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 min-w-[180px]"
                                            style={{ background: gradient }}
                                        >
                                            {icon && (
                                                <img loading="lazy" decoding="async" src={icon} alt={plan} className="w-6 h-6" />
                                            )}
                                            <span className="text-white font-semibold text-lg uppercase">
                                                {formatPlanName(clientPlan)}
                                            </span>
                                            <span className="text-white text-base font-medium">
                                                Member
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                    </div>
                </div>
                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${activeTab === tab
                                    ? 'border-[#13097D] text-[#13097D]'
                                    : 'border-transparent text-[#8C8CA1] hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-3 px-2 border-b-[3px] font-semibold text-[12px] md:text-sm transition-colors shrink-0 hover:cursor-pointer`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'Client Info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side - Preferred Course and Preferred States */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <img loading="lazy" decoding="async" src="/capIcon.svg" alt="Cap" className="w-5 h-5" />
                                        <h3 className="text-lg font-semibold" style={{ color: '#242645' }}>
                                            Preferred Course
                                        </h3>
                                    </div>
                                    <p className="text-gray-700 text-base">
                                        {userDetail?.interestedCourse || 'Not specified'}
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <img loading="lazy" decoding="async" src="/locationIcon.svg" alt="Location" className="w-5 h-5" />
                                        <h3 className="text-lg font-semibold" style={{ color: '#242645' }}>
                                            Preferred States
                                        </h3>
                                    </div>
                                    {userDetail?.userInterestedStateOfCounsellors?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {userDetail.userInterestedStateOfCounsellors.map((state: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium"
                                                >
                                                    {state}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No states specified</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Side - Notes */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={20} style={{ color: '#242645' }} />
                                            <h3 className="text-lg font-semibold" style={{ color: '#242645' }}>Notes</h3>
                                        </div>
                                        {!isEditingNote && (
                                            <button
                                                onClick={() => {
                                                    setIsEditingNote(true);
                                                    // Prefill with latest note if exists
                                                    if (clientNotes.length > 0) {
                                                        setNoteText(clientNotes[clientNotes.length - 1].noteText);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#13097D] text-white rounded-lg hover:bg-[#0f0760] transition-colors cursor-pointer"
                                            >
                                                <Plus size={16} />
                                                <span className="text-sm font-medium">
                                                    {clientNotes.length > 0 ? 'Update Note' : 'Add Note'}
                                                </span>
                                            </button>
                                        )}
                                    </div>

                                    {isEditingNote ? (
                                        // Editing mode - shows the note being edited
                                        <div className="space-y-3">
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Enter your note here..."
                                                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13097D] focus:border-transparent resize-none bg-white"
                                                />
                                                {clientNotes.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Last updated: {formatNoteDate(clientNotes[clientNotes.length - 1].timestamp)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveNote}
                                                    disabled={isSavingNote}
                                                    className="px-4 py-2 bg-[#13097D] text-white rounded-lg hover:bg-[#0f0760] transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                                >
                                                    {isSavingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    {clientNotes.length > 0 ? 'Update Note' : 'Save Note'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingNote(false);
                                                        setNoteText('');
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View mode - shows all notes
                                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                            {clientNotes.length > 0 ? (
                                                clientNotes.map((note: any, index: number) => (
                                                    <div
                                                        key={`${note.timestamp}-${index}`}
                                                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                                    >
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                                            {note.noteText}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {formatNoteDate(note.timestamp)}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm text-center py-8">
                                                    No notes yet. Click "Add Note" to create one.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Appointments' && (
                        <div>
                            {isLoadingAppointments ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#13097D]" />
                                </div>
                            ) : appointments.length > 0 ? (
                                <div className="space-y-4">
                                    {appointments.map((appointment: any) => (
                                        <div key={appointment.appointmentId}>
                                            {/* Mobile View */}
                                            <div className="block md:hidden bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-gray-500">
                                                        {client.course} Counselling Session
                                                    </p>
                                                    {getStatusChip(appointment.status)}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gray-100 p-1.5 rounded-xl">
                                                            <Calendar className="text-gray-500" size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-[#232323]">Date</p>
                                                            <p className="text-xs font-medium text-[#232323]">
                                                                {formatDate(appointment.date)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-gray-100 p-1.5 rounded-xl">
                                                            <Clock className="text-gray-500" size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-[#232323]">Time</p>
                                                            <p className="text-xs font-medium text-[#232323] text-nowrap">
                                                                {`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop View */}
                                            <div className="hidden md:block bg-white border border-gray-200 rounded-2xl py-6 px-6 hover:shadow-md transition-shadow">
                                                <div className="grid grid-cols-12 gap-4 items-center">
                                                    <div className="col-span-5">
                                                        <h4 className="font-semibold text-xl text-[#242645]">
                                                            {client.course} Counselling Session
                                                        </h4>
                                                        <p className="text-base font-medium text-[#8C8CA1] mt-1">
                                                            with {client.name}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-2">
                                                        <p className="text-xl font-semibold text-[#242645]">Date</p>
                                                        <p className="font-medium text-base text-[#8C8CA1] whitespace-nowrap">
                                                            {formatDate(appointment.date)}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <p className="text-xl font-semibold text-[#242645]">Time</p>
                                                        <p className="font-medium text-base text-[#8C8CA1] whitespace-nowrap">
                                                            {`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-2 flex items-center justify-end">
                                                        {getStatusChip(appointment.status)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                                    <p className="text-gray-500 text-lg">No appointments found</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        This client hasn't scheduled any appointments yet
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
