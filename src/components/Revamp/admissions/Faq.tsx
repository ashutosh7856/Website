import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { homeFaqs } from "@/components/SEO/homeSeoContent";

export default function Faq() {
    // Same list the home page publishes as FAQPage schema.
    const faqData = homeFaqs

    const [open, setOpen] = useState<number | null>(null)

    const toggleFaq = (index: number) => {
        setOpen(open === index ? null : index)
    }

    return (
        <section className="w-full bg-[#C6DDF040]" aria-labelledby="home-faq-heading">
            <div className="max-w-7xl px-4 md:px-8 mx-auto py-6 md:py-10 flex flex-col gap-6 md:gap-8">
                
                {/* Mobile Heading Layout (Matches other sections) */}
                <div className="md:hidden flex items-center justify-start gap-[8px] bg-white px-[12px] py-[4px] rounded-[4px] w-fit shrink-0">
                    <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] bg-[#0E1629] shrink-0" />
                    <p className="font-[Poppins] font-semibold text-[12px] text-[#0E1629] uppercase tracking-[0.07em] leading-none whitespace-nowrap">
                        FAQ
                    </p>
                </div>

                {/* Desktop Heading (Original) */}
                <img loading="lazy" decoding="async" src="/faq.svg" alt="" aria-hidden="true" className="hidden md:block h-[29px] w-[88px]" />
                <h2 id="home-faq-heading" className="sr-only">Frequently asked questions</h2>

                <div className="flex flex-col gap-3 md:gap-4">
                    {faqData.map((item, index) => (
                        <div 
                            key={index} 
                            className="w-full max-w-[1320px] bg-white rounded-lg overflow-hidden transition-all duration-300"
                        >
                            <button
                                type="button"
                                onClick={() => toggleFaq(index)}
                                aria-expanded={open === index}
                                aria-controls={`home-faq-answer-${index}`}
                                id={`home-faq-question-${index}`}
                                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F43F2] w-full flex items-center justify-between py-3 px-4 md:py-[18px] md:px-[24px] text-left cursor-pointer transition-colors duration-200 hover:bg-white group"
                            >
                                <span 
                                    className="font-[Poppins] font-medium text-[14px] md:text-[18px] leading-[1.3] md:leading-[100%] text-(--text-main)"
                                    style={{ verticalAlign: "middle" }}
                                >
                                    {item.question}
                                </span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className={`flex-shrink-0 transition-transform duration-200 text-(--text-main) w-5 h-5 md:w-6 md:h-6 ${
                                        open === index ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            <div
                                id={`home-faq-answer-${index}`}
                                role="region"
                                aria-labelledby={`home-faq-question-${index}`}
                                aria-hidden={open !== index}
                                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                    open === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                }`}
                            >
                                <div className="px-4 pb-3 md:px-[24px] md:pb-[18px]">
                                    <p className="font-[Poppins] font-normal text-[12px] md:text-[18px] leading-[1.4] md:leading-[100%] text-[#6B7280] md:text-(--text-muted) mt-2 md:mt-[18px]">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}