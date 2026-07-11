import type { Transaction } from '@/types/earnings';
import { ArrowDownCircle, ArrowUpCircle, XCircle } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
}

const formatDate = (timestamp: number, short = false) => {
  if (!timestamp) return 'Invalid Date';
  const date = new Date(timestamp);
  if (short) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).format(date).replace(/ /g, ' ');
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    weekday: 'long',
  }).format(date);
};

const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return '₹--';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (amount: number) => {
  if (typeof amount !== 'number') return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const truncateText = (text: string | null | undefined, maxLength: number) => {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

const CounselorTransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const isFailed = transaction.status?.toLowerCase() === 'failed';
  const isDebit = transaction.type === 'payout' && !isFailed;
  const isCredit = transaction.type === 'credit' && !isFailed;

  const getTransactionDetails = () => {
    let mobileLine1 = '';
    let mobileLine2 = '';

    let desktopTitle = '';
    let desktopDescription = '';
    let amountColor = 'text-gray-800';
    let icon;
    let isOfflineCredit = false;

    if (isFailed) {
      icon = <XCircle className="w-10 h-10 text-[#EE1C1F] sm:w-12 sm:h-12 bg-[#EE1C1F26] rounded-full p-1.5 sm:p-2 shrink-0" />;
      amountColor = 'text-[#EE1C1F]';
      
      mobileLine1 = 'Payment Failed';
      mobileLine2 = transaction.description || 'Procounsel';

      desktopTitle = 'Payment Failed';
      desktopDescription = 'Procounsel';

    } else if (isCredit) {
      icon = <ArrowDownCircle className="w-10 h-10 text-[#28A745] sm:w-12 sm:h-12 bg-[#28A74526] rounded-full p-1.5 sm:p-2 shrink-0" />;
      amountColor = 'text-[#28A745]';

      let creditSource = 'Bank';
      const description = transaction.description;

      if (description) {
          const lowerDesc = description.toLowerCase();
          
          if (lowerDesc.startsWith('received from ')) {
              const extractedName = description.substring(14).trim();
              if (extractedName) {
                  creditSource = extractedName;
              }
          } else if (lowerDesc.includes('offline subscription')) {
              isOfflineCredit = true;
              if (lowerDesc.startsWith('offline subscription received from user: ')) {
                const extractedName = description.substring(41).trim();
                if (extractedName) {
                    creditSource = extractedName;
                }
              } else {
                creditSource = "Offline User"
              }
          }
      }

      if (isOfflineCredit) {
        mobileLine1 = 'Offline Payment From';
        desktopTitle = 'Offline Payment From';
      } else {
        mobileLine1 = 'ProCoins Transferred From';
        desktopTitle = 'ProCoins Transferred From';
      }
      mobileLine2 = creditSource;
      desktopDescription = creditSource;

    } else { // debit
      icon = <ArrowUpCircle className="w-10 h-10 text-blue-500 sm:w-12 sm:h-12 bg-blue-50 rounded-full p-1.5 sm:p-2 shrink-0" />;
      mobileLine1 = 'Paid to';
      mobileLine2 = (transaction.description || '').replace(/^Paid to /i, '');
      desktopTitle = transaction.description || 'Paid to Procounsel';
      desktopDescription = 'Procounsel';
    }

    return { icon, amountColor, mobileLine1, mobileLine2, desktopTitle, desktopDescription, isOfflineCredit };
  };

  const { icon, amountColor, mobileLine1, mobileLine2, desktopTitle, desktopDescription, isOfflineCredit } = getTransactionDetails();

  const showProCoin = isCredit && !isOfflineCredit;

  return (
    <>
      {/*mobile view*/}
      <div className="sm:hidden bg-white p-3 rounded-xl border border-[#EFEFEF] flex items-center justify-between h-[74px]">
        <div className="flex items-center gap-3 overflow-hidden">
          {icon}
          <div>
            <p className="font-medium text-xs text-[#718EBF]">{mobileLine1}</p>
            <p className="font-medium text-sm text-[#232323] truncate">{mobileLine2}</p>
            <p className="font-medium text-xs text-[#718EBF] mt-1">
              Transaction ID: {truncateText(transaction.paymentId, 8)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <p className={`font-medium text-base ${amountColor} flex items-center justify-end`}>
            {showProCoin ? (
              <>
                <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="PC" className="w-4 h-4 mr-1" />
                {formatNumber(transaction.amount)}
              </>
            ) : (
              <>
                {isDebit ? '-' : ''}
                {formatCurrency(transaction.amount)}
              </>
            )}
          </p>
          <p className="font-medium text-xs text-[#718EBF] leading-tight mt-0.5">
            {formatDate(transaction.timestamp, true)}
          </p>
        </div>
      </div>

      {/*desktop view*/}
      <div className="hidden sm:flex items-center gap-4 w-full py-6">
        <div className="flex items-center gap-4 w-[40%] shrink-0">
          {icon}
          <div className="grow overflow-hidden">
            <h4 className="font-semibold text-lg text-[#242645]">{desktopTitle}</h4>
            <p className="text-base font-medium text-[#8C8CA1] truncate" title={desktopDescription || ''}>
                {desktopDescription || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8 w-[40%]">
          <div className="w-1/2">
            <p className="text-sm font-semibold text-[#8C8CA1] mb-1">Transaction ID</p>
            <p className="font-medium text-base text-[#242645] truncate" title={transaction.paymentId || ''}>
                {truncateText(transaction.paymentId, 12)}
            </p>
          </div>
          <div className="w-1/2">
            <p className="text-sm font-semibold text-[#8C8CA1] mb-1">Date</p>
            <p className="font-medium text-base text-[#242645] whitespace-nowrap">{formatDate(transaction.timestamp)}</p>
          </div>
        </div>
        <div className="flex justify-end w-[20%]">
             <div>
                <p className="text-sm font-semibold text-[#8C8CA1] mb-1 text-right">Amount</p>
                <p className={`font-semibold text-lg ${amountColor} flex items-center justify-end`}>
                  {showProCoin ? (
                    <>
                      <img loading="lazy" decoding="async" src="/Procoin.jpg" alt="ProCoin" className="w-5 h-5 mr-1" />
                      {formatNumber(transaction.amount)}
                    </>
                  ) : (
                    <>
                      {isDebit ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </>
                  )}
                </p>
            </div>
        </div>
      </div>
    </>
  );
};

export default CounselorTransactionCard;