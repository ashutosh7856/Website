import { useEffect } from "react";

type Step2Data = {
  courseDurationType: string;
  coursePrice: string;
  discount: string;
  coursePriceAfterDiscount: number;
};

type Step2CardProps = {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
};

export default function Step2Card({ data, onChange }: Step2CardProps) {

  useEffect(() => {
    const price = parseFloat(data.coursePrice) || 0;
    const discount = parseFloat(data.discount) || 0;
    const priceAfterDiscount = Math.max(0, price - discount);
    
    if (priceAfterDiscount !== data.coursePriceAfterDiscount) {
      onChange({ ...data, coursePriceAfterDiscount: priceAfterDiscount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute only when price/discount change; `data`/`onChange` are new objects every parent render
  }, [data.coursePrice, data.discount]);

  return (// Auto-calculate price after discount
    <>
    <div className="flex flex-col gap-3 md:gap-5 bg-white w-full max-w-234 min-h-[20rem] md:min-h-[29.688rem] p-3 md:p-6 rounded-2xl">
      <div className="flex flex-col gap-2 md:gap-3 items-start w-full">
        <label
          htmlFor="name"
          className="text-sm md:text-[1rem] font-medium text-[#8C8CA1]"
        >
          Course Duration Type*
        </label>
        <input
          type="text"
          placeholder="Lifetime Validity"
          value={data.courseDurationType}
          onChange={(e) => onChange({ ...data, courseDurationType: e.target.value })}
          className="bg-[#F5F7FA] rounded-[0.75rem] h-10 md:h-12 p-2 w-full text-sm md:text-base"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-5 w-full">
        <div className="flex flex-col gap-2 md:gap-3 items-start flex-1">
          <label
            htmlFor="button"
            className="text-sm md:text-[1rem] font-medium text-[#8C8CA1]"
          >
            Price*
          </label>
          <input
            type="number"
            placeholder="₹"
            value={data.coursePrice}
            onChange={(e) => onChange({ ...data, coursePrice: e.target.value })}
            className="bg-[#F5F7FA] rounded-[0.75rem] h-10 md:h-12 p-2 w-full text-sm md:text-base"
          />
        </div>

        <div className="flex flex-col gap-2 md:gap-3 items-start flex-1">
          <label
            htmlFor="button"
            className="text-sm md:text-[1rem] font-medium text-[#8C8CA1]"
          >
            Discount*
          </label>
          <input
            type="number"
            placeholder="₹"
            value={data.discount}
            onChange={(e) => onChange({ ...data, discount: e.target.value })}
            className="bg-[#F5F7FA] rounded-[0.75rem] h-10 md:h-12 p-2 w-full text-sm md:text-base"
          />
        </div>

        <div className="flex flex-col gap-2 md:gap-3 items-start flex-1">
          <label
            htmlFor="button"
            className="text-sm md:text-[1rem] font-medium text-[#8C8CA1]"
          >
            Final Price*
          </label>
          <input
            type="number"
            placeholder="₹"
            value={data.coursePriceAfterDiscount}
            readOnly
            className="bg-[#E8E8E8] rounded-[0.75rem] h-10 md:h-12 p-2 w-full text-sm md:text-base cursor-not-allowed"
          />
        </div>
      </div>
    </div>
    </>
  );
}
