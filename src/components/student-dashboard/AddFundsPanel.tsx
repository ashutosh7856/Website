import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AddFundsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddMoney: (amount: number) => void;
  isProcessing?: boolean;
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("en-IN");
};

const AddFundsPanel: React.FC<AddFundsPanelProps> = ({
  isOpen,
  onClose,
  balance,
  onAddMoney,
  isProcessing,
}) => {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
    }
  }, [isOpen]);

  const handleAddClick = () => {
    if (!amount || Number(amount) <= 0 || isProcessing) return;
    onAddMoney(Number(amount));
  };

  const presetAmounts = [1000, 3000, 5000];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`
          fixed z-[201] bg-white shadow-2xl transition-all duration-300 ease-in-out
          
          /* Mobile: Centered modal */
          inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl max-h-[90vh] overflow-y-auto
          
          /* Desktop: Right side panel */
          md:inset-y-0 md:right-0 md:left-auto md:translate-y-0 md:w-[460px] md:rounded-none md:max-h-full
          
          ${
            isOpen
              ? "opacity-100 scale-100 md:translate-x-0"
              : "opacity-0 pointer-events-none scale-95 md:translate-x-full"
          }
        `}
      >
        <div className="flex items-center justify-between h-[68px] px-6 border-b border-[#EFEFEF]">
          <h2 className="text-lg font-semibold text-[#343C6A]">
            Wallet Balance
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors hover:bg-gray-100 hover:cursor-pointer"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[#343C6A] mb-3">
              Available ProCoins
            </h3>
            <div className="flex items-center justify-center px-4 h-[49px] bg-white border border-[#EFEFEF] rounded-2xl">
              <span className="font-semibold text-lg text-green-600 flex items-center gap-1">
                {balance} <img loading="lazy" decoding="async" src="/coin.svg" alt="" />
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#343C6A] mb-3">
              Add Money to Your Wallet
            </h3>
            <div className="p-4 border border-[#EFEFEF] rounded-2xl">
              <div className="relative flex items-center justify-center h-10 bg-[#F5F5F5] border border-[#EFEFEF] rounded-[10px]">
                {amount && (
                  <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-5 h-5 mr-1" />
                )}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      setAmount("");
                      return;
                    }

                    const num = Number(value);

                    if (num <= 500000) {
                      setAmount(value);
                    }
                  }}
                  min={0}
                  max={500000}
                  placeholder="Enter Amount"
                  className="no-spinner bg-transparent text-center text-lg font-semibold  placeholder:text-[#23232380] focus:outline-none  shrink-0"
                  style={{ width: amount ? `${amount.length + 1}ch` : "auto", minWidth: "140px" }}
                />
              </div>
              <div className="flex flex-wrap justify-center md:justify-between my-4 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const currentAmount = Number(amount) || 0;
                      if(Number(amount)>=500000){
                        return
                      }
                      setAmount(String(currentAmount + preset));
                    }}
                    className="flex-1 min-w-[100px] h-10 border border-[#13097D] rounded-[10px] text-[#13097D] font-semibold text-sm text-center hover:cursor-pointer hover:bg-[#13097D] hover:text-white transition-colors md:flex-none md:w-[117px] flex items-center justify-center gap-1"
                  >
                    + <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-4 h-4" />{" "}
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddClick}
                disabled={!amount || Number(amount) <= 0 || isProcessing}
                className="w-full h-[42px] bg-[#FA660F] rounded-[12px] text-white font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors hover:cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Add Money"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddFundsPanel;
