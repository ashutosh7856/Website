import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityLog } from '@/types/user';
import { getRelativeTime } from '@/utils/dateUtils';
import SmartImage from '@/components/ui/SmartImage';
import { useAuthStore } from '@/store/AuthStore';
import { getAppointmentById } from '@/api/appointment';
import { getUserById, getCounselorAppointmentById } from '@/api/counselor-Dashboard';
import toast from 'react-hot-toast';
import NotificationAppointmentModal from '@/components/notifications/NotificationAppointmentModal';
import type { NotificationAppointment } from '@/components/notifications/NotificationAppointmentModal';
import { encodeCounselorId } from '@/lib/utils';

interface NotificationDropdownProps {
  notifications: ActivityLog[];
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose }) => {
  const navigate = useNavigate();
  const { userId, role } = useAuthStore();
  const token = localStorage.getItem('jwt');

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<NotificationAppointment | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<ActivityLog | null>(null);

  const sortedNotifications = [...notifications].sort((a, b) => {
    const timeA = a.timestamp.seconds;
    const timeB = b.timestamp.seconds;
    return timeB - timeA;
  });

  const handleNotificationClick = async (notif: ActivityLog) => {
    if (role === 'counselor') {
      if (!userId || !token) return;
      const type = notif.activityType?.toLowerCase();

      if (type === 'subscription' || type === 'subscribe') {
        try {
          const toastId = toast.loading("Loading client profile...");
          const userData = await getUserById(userId, notif.activitySenderId, token);
          toast.dismiss(toastId);

          if (userData) {
            const clientObj = {
              id: userData.userName || notif.activitySenderId,
              name: `${userData.firstName} ${userData.lastName}`,
              imageUrl: userData.photo,
              course: userData.interestedCourse || 'N/A',
              email: userData.email,
              phone: userData.phoneNumber
            };

            onClose();
            navigate('/counselor-dashboard/client-profile', {
              state: {
                client: clientObj,
                counsellorId: userId,
                token: token
              }
            });
          }
        } catch (error) {
          console.error("Failed to fetch user for profile navigation", error);
          toast.error("Could not load client profile.");
        }
        return;
      }

      else if (type === 'appointment') {
        try {
          const appointmentId = notif.id;
          const toastId = toast.loading("Opening details...");

          const appointmentData = await getCounselorAppointmentById(userId, appointmentId, token);
          
          toast.dismiss(toastId);

          if (appointmentData) {
            setSelectedAppointment(appointmentData);
            setSelectedNotification(notif);
            setIsAppointmentModalOpen(true);
          }
        } catch (error) {
          console.error("Failed to fetch counselor appointment", error);
          toast.error("Could not load appointment details");
        }
        return;
      }
      return; 
    }

    setSelectedNotification(notif);
    const type = notif.activityType?.toLowerCase();
    
    if (type === 'subscription' || type === 'subscribe') {
      onClose();
      navigate(`/counsellor/${encodeCounselorId(notif.activitySenderId)}`);
    }

    else if (type === 'appointment') {
      if (!userId || !token) return;

      try {
        const appointmentId = notif.id;
        const toastId = toast.loading("Opening details...");
        
        const appointmentData = await getAppointmentById(userId, appointmentId, token);
        
        toast.dismiss(toastId);
        
        if (appointmentData) {
            setSelectedAppointment(appointmentData);
            setIsAppointmentModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch appointment", error);
        toast.error("Could not load appointment details");
      }
    }
  };

  const handleModalNavigation = async (targetId: string) => {
    if (role === 'counselor') {
        if (!userId || !token) return;
        try {
            const toastId = toast.loading("Loading client profile...");
            const userData = await getUserById(userId, targetId, token);
            toast.dismiss(toastId);
  
            if (userData) {
              const clientObj = {
                id: userData.userName || targetId,
                name: `${userData.firstName} ${userData.lastName}`,
                imageUrl: userData.photo,
                course: userData.interestedCourse || 'N/A',
                email: userData.email,
                phone: userData.phoneNumber
              };
  
              setIsAppointmentModalOpen(false);
              onClose();
              navigate('/counselor-dashboard/client-profile', {
                state: {
                  client: clientObj,
                  counsellorId: userId,
                  token: token
                }
              });
            }
          } catch {
            toast.error("Could not navigate to client.");
          }
    } 
    else {
        navigate(`/counsellor/${encodeCounselorId(targetId)}`);
        setIsAppointmentModalOpen(false);
        setSelectedAppointment(null);
        setSelectedNotification(null);
        onClose();
    }
  };


  return (
    <>
      <div 
        className="absolute z-50 flex flex-col bg-white"
        style={{
          width: '616px',
          top: '60px',
          right: '-80px',
          borderRadius: '12px',
          padding: '12px',
          gap: '12px',
          boxShadow: '0px 4px 4px 0px #13097D1A, 0px 0px 4px 0px #13097D33',
          cursor: 'default' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-2 pt-1">
          <h3 
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '125%',
              color: '#13097D'
            }}
          >
            Notifications
          </h3>
          <button
            onClick={() => {
              onClose();
              navigate('/notifications');
            }}
            className="hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '100%',
              color: '#3D3D3D',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            See All &gt;
          </button>
        </div>

        <div className="w-full h-px bg-[#F4F4F4] mt-2" />

        <div className="flex flex-col max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {sortedNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No new notifications</div>
          ) : (
            sortedNotifications.slice(0, 6).map((notif, index) => (
              <div 
                key={`${notif.id}_${notif.timestamp.seconds}_${notif.timestamp.nanos}_${index}`}
                onClick={() => handleNotificationClick(notif)}
                className="flex items-start transition-colors hover:bg-gray-50 cursor-pointer"
                style={{
                  width: '100%',
                  padding: '20px',
                  gap: '12px',
                  borderBottom: '1px solid #F4F4F4',
                  background: '#FFFFFF'
                }}
              >
                <div 
                  className="shrink-0 rounded-full overflow-hidden"
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <SmartImage
                    src={notif.photo || 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg'}
                    alt="Sender"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-[7px]">
                  <p
                    style={{
                      fontFamily: 'Mulish, sans-serif',
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: '#6C6969',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {notif.activity}
                  </p>
                  <span
                    style={{
                      fontFamily: 'Mulish, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '100%',
                      color: '#262626'
                    }}
                  >
                    {getRelativeTime(notif.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedAppointment && selectedNotification && (
        <NotificationAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setSelectedAppointment(null);
            setSelectedNotification(null);
          }}
          appointment={selectedAppointment}
          notification={selectedNotification}
          onNavigateToCounselor={handleModalNavigation}
        />
      )}
    </>
  );
};

export default NotificationDropdown;