import { X, Check, Loader2, Clock } from "lucide-react";
import type { Client } from "@/types/client";

interface ClientCardProps {
  client: Client;
  variant: "client" | "pending";
  onAccept?: () => void;
  onReject?: () => void;
  isResponding?: boolean;
  onClick?: () => void;
}

const formatPlanName = (plan: string) => {
  if (plan === "plus") return "Plus";
  if (plan === "premium") return "Premium";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

const formatTimeAgo = (date: Date, isMobile: boolean = false) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (isMobile) {
    // Shorter format for mobile
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};

const renderStates = (states: string[]) => {
  if (!states || states.length === 0) return null;

  const visible = states.slice(0, 2);
  const remaining = states.length - visible.length;

  return {
    visibleText: visible.join(", "),
    remaining,
    full: states.join(", "),
  };
};

export default function ClientCard({
  client,
  variant,
  onAccept,
  onReject,
  isResponding,
  onClick,
}: ClientCardProps) {
  return (
    <>
      {/*mobile view*/}
      <div
        className={`block md:hidden bg-white border border-[#EFEFEF] rounded-2xl p-3 space-y-3 shadow-sm font-montserrat ${variant === 'client' && onClick ? 'hover:cursor-pointer hover:shadow-md transition-shadow' : ''
          }`}
        onClick={() => variant === 'client' && onClick && onClick()}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <img loading="lazy" decoding="async"
              src={client.imageUrl}
              alt={client.name}
              className="w-11 h-11 rounded-md object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-[#242645] truncate">
                {client.name}
              </h4>
              <p className="font-normal text-xs text-[#8C8CA1] truncate">
                {client.course}
              </p>
            </div>
          </div>
          {variant === "pending" && onAccept && onReject && (
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                onClick={onReject}
                disabled={isResponding}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Reject"
              >
                <X size={16} />
              </button>
              <button
                onClick={onAccept}
                disabled={isResponding}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-[#13097D] text-[#13097D] hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50"
                aria-label="Accept"
              >
                {isResponding ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={16} />
                )}
              </button>
            </div>
          )}
        </div>

        {client.plan && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-[#8C8CA1]">Plan</p>
                <p className="font-semibold text-sm text-[#242645] capitalize truncate">
                  {formatPlanName(client.plan)}
                </p>
              </div>
              {client.amount && (
                <div>
                  <p className="text-xs text-[#8C8CA1]">Amount</p>
                  <p className="font-semibold text-sm text-[#242645] truncate">
                    ₹{client.amount}
                  </p>
                </div>
              )}
              {client.createdAt && variant === "pending" && (
                <div>
                  <p className="text-xs text-[#8C8CA1]">Time</p>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-[#242645]" />
                    <span className="font-semibold text-sm text-[#242645]">
                      {formatTimeAgo(client.createdAt, true)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {client.interestedStates &&
              client.interestedStates.length > 0 &&
              variant === "client" && (
                <div>
                  <p className="text-xs text-[#8C8CA1] mb-1">
                    Interested States
                  </p>
                  {(() => {
                    const data = renderStates(client.interestedStates);
                    if (!data) return null;

                    return (
                      <p
                        className="font-medium text-xs text-[#242645] truncate"
                        title={data.full}
                      >
                        {data.visibleText}
                        {data.remaining > 0 && (
                          <span className="ml-1 text-[#13097D] font-semibold">
                            +{data.remaining} more
                          </span>
                        )}
                      </p>
                    );
                  })()}
                </div>
              )}
          </div>
        )}
      </div>
      {/*desktop*/}
      <div
        className={`hidden md:block py-6 ${variant === 'client' && onClick ? 'hover:cursor-pointer hover:bg-gray-50 transition-colors rounded-lg -mx-4 px-4' : ''
          }`}
        onClick={() => variant === 'client' && onClick && onClick()}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-3 flex items-center gap-4">
            <img loading="lazy" decoding="async"
              src={client.imageUrl}
              alt={client.name}
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xl text-[#242645] truncate">
                {client.name}
              </h4>
              <p className="font-medium text-base text-[#8C8CA1] truncate">
                {client.course}
              </p>
            </div>
          </div>

          {client.plan && (
            <div
              className={`flex items-center gap-6 ${client.interestedStates &&
                client.interestedStates.length > 0 &&
                variant === "client"
                ? "md:col-span-7"
                : "md:col-span-7"
                }`}
            >
              <div className="shrink-0">
                <h5 className="font-semibold text-lg text-[#242645]">Plan</h5>
                <p className="font-medium text-base text-[#8C8CA1] capitalize">
                  {formatPlanName(client.plan)}
                </p>
              </div>
              {client.amount && (
                <div className="shrink-0">
                  <h5 className="font-semibold text-lg text-[#242645]">
                    Amount
                  </h5>
                  <p className="font-medium text-base text-[#8C8CA1]">
                    ₹{client.amount}
                  </p>
                </div>
              )}
              {client.createdAt && variant === "pending" && (
                <div className="shrink-0">
                  <h5 className="font-semibold text-lg text-[#242645]">
                    Requested
                  </h5>
                  <div className="flex items-center gap-1.5 text-[#8C8CA1]">
                    <Clock size={16} />
                    <p className="font-medium text-base">
                      {formatTimeAgo(client.createdAt)}
                    </p>
                  </div>
                </div>
              )}
              {client.interestedStates &&
                client.interestedStates.length > 0 &&
                variant === "client" && (
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-lg text-[#242645]">
                      Interested States
                    </h5>
                    {(() => {
                      const data = renderStates(client.interestedStates);
                      if (!data) return null;

                      return (
                        <p
                          className="font-medium text-base text-[#8C8CA1] truncate"
                          title={data.full}
                        >
                          {data.visibleText}
                          {data.remaining > 0 && (
                            <span className="ml-1 text-[#13097D] font-semibold">
                              +{data.remaining} more
                            </span>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                )}
            </div>
          )}

          {variant === "pending" && onAccept && onReject && (
            <div className="md:col-span-2 flex items-center justify-end gap-2">
              <button
                onClick={onReject}
                disabled={isResponding}
                className="w-8 h-8 flex items-center hover:cursor-pointer justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                aria-label="Reject"
              >
                <X size={20} />
              </button>
              <button
                onClick={onAccept}
                disabled={isResponding}
                className="w-8 h-8 flex items-center justify-center hover:cursor-pointer rounded-full border border-[#13097D] text-[#13097D] hover:bg-green-50 hover:text-green-600 transition-colors disabled:opacity-50"
                aria-label="Accept"
              >
                {isResponding ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Check size={20} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
