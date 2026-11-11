import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ClientCard from '../cards/ClientCard';
import type { Client, ApiClient, ApiPendingRequest } from '@/types/client';
import type { User } from '@/types/user';
import { getSubscribedClients, getPendingRequests, respondToSubscriptionRequest } from '@/api/counselor-Dashboard';
import { Loader2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type SubTab = 'My Clients' | 'Pending Request';

interface Props {
  user: User;
  token: string;
}

function isPendingRequest(client: ApiClient | ApiPendingRequest): client is ApiPendingRequest {
  return 'userFullName' in client;
}

export default function ClientsTab({ user, token }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('My Clients');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const TABS: SubTab[] = ['My Clients', 'Pending Request'];

  const formatClients = (apiData: (ApiClient | ApiPendingRequest)[]): Client[] => {
    return apiData.map((item) => {
      if (isPendingRequest(item)) {
        return {
          id: item.userId,
          name: item.userFullName,
          imageUrl: item.userSmallPhotoUrl || `https://ui-avatars.com/api/?name=${item.userFullName}`,
          course: item.userInterestedCourse,
          plan: item.plan,
          amount: item.amount,
          createdAt: new Date(item.createdAt.seconds * 1000),
          manualSubscriptionRequestId: item.manualSubscriptionRequestId,
        };
      } else {
        return {
          id: item.userId,
          name: `${item.firstName} ${item.lastName}`,
          imageUrl: item.photoSmall || `https://ui-avatars.com/api/?name=${item.firstName}+${item.lastName}`,
          course: item.course,
          plan: item.plan,
          interestedStates: item.userInterestedStateOfCounsellors || [],
          manualSubscriptionRequestId: item.manualSubscriptionRequestId,
        };
      }
    });
  };

  const {
    data: apiClients,
    isLoading: isLoadingClients,
    error: clientsError
  } = useQuery({
    queryKey: ['subscribedClients', user.userName],
    queryFn: () => getSubscribedClients(user.userName, token),
    enabled: !!user.userName && !!token,
    select: formatClients,
  });

  const {
    data: apiPending,
    isLoading: isLoadingPending,
    error: pendingError
  } = useQuery({
    queryKey: ['pendingClients', user.userName],
    queryFn: () => getPendingRequests(user.userName, token),
    enabled: !!user.userName && !!token,
    select: formatClients,
  });

  const isLoading = activeSubTab === 'My Clients' ? isLoadingClients : isLoadingPending;
  const error = activeSubTab === 'My Clients' ? clientsError : pendingError;
  const myClients = useMemo(() => apiClients || [], [apiClients]);
  const pendingRequests = useMemo(() => apiPending || [], [apiPending]);

  const invalidateClientQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['subscribedClients', user.userName] });
    queryClient.invalidateQueries({ queryKey: ['pendingClients', user.userName] });
  };

  const { mutate: acceptMutation, isPending: isAccepting } = useMutation({
    mutationFn: (client: Client) => {
      if (!client.manualSubscriptionRequestId) throw new Error("Request ID is missing.");
      return respondToSubscriptionRequest(client.manualSubscriptionRequestId, 'completed', token);
    },
    onSuccess: (_, client) => {
      toast.success(`Subscription request from ${client.name} accepted.`);
      invalidateClientQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Action failed.');
    }
  });

  const { mutate: rejectMutation, isPending: isRejecting } = useMutation({
    mutationFn: (client: Client) => {
      if (!client.manualSubscriptionRequestId) throw new Error("Request ID is missing.");
      return respondToSubscriptionRequest(client.manualSubscriptionRequestId, 'rejected', token);
    },
    onSuccess: (_, client) => {
      toast.error(`Subscription request from ${client.name} rejected.`);
      invalidateClientQueries();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Action failed.');
    }
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleAccept = (client: Client) => {
    setRespondingId(client.id);
    acceptMutation(client, { onSettled: () => setRespondingId(null) });
  };

  const handleReject = (client: Client) => {
    setRespondingId(client.id);
    rejectMutation(client, { onSettled: () => setRespondingId(null) });
  };

  const filteredClients = useMemo(() => {
    const listToFilter = activeSubTab === 'My Clients' ? myClients : pendingRequests;
    if (!searchQuery) {
      return listToFilter;
    }
    return listToFilter.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, myClients, pendingRequests, activeSubTab]);


  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }
    if (error) {
      return <div className="text-center py-16 text-red-500">{(error as Error).message}</div>;
    }

    return filteredClients.length > 0 ? (
      filteredClients.map(client =>
        <ClientCard
          key={client.id}
          client={client}
          variant={activeSubTab === 'My Clients' ? 'client' : 'pending'}
          onClick={activeSubTab === 'My Clients' ? () => navigate('/counselor-dashboard/client-profile', { state: { client, counsellorId: user.userName, token } }) : undefined}
          onAccept={() => handleAccept(client)}
          onReject={() => handleReject(client)}
          isResponding={respondingId === client.id && (isAccepting || isRejecting)}
        />
      )
    ) : (
      <div className="text-center py-16 text-gray-500">
        {searchQuery ? `No clients found for "${searchQuery}"` :
          (activeSubTab === 'My Clients' ? 'You do not have any subscribed clients yet.' : 'There are no pending requests.')
        }
      </div>
    );
  };

  return (
    <div className="md:bg-white md:p-6 md:rounded-2xl md:border md:border-[#EFEFEF]">
      <div className="relative mb-4 md:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search Clients"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-white border border-[#EFEFEF] rounded-xl text-sm placeholder:text-[#8C8CA1] focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="bg-white p-2 rounded-xl border border-[#EFEFEF] md:bg-transparent md:p-0 md:border-none md:mb-5">
        <div className="flex items-center gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setSearchQuery('');
              }}
              className={`flex-1 md:flex-none hover:cursor-pointer px-4 py-2 text-[12px] md:text-base font-medium rounded-full transition-colors duration-200 ${activeSubTab === tab
                ? 'bg-[#E8E7F2] text-[#13097D]'
                : 'bg-transparent text-gray-500 hover:text-gray-800'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:block md:gap-0 md:divide-y md:divide-gray-200 md:mt-0 mt-4">
        {renderContent()}
      </div>
    </div>
  );
}