interface AdvantageCardProps {
    title: string;
    description: string;
}

export default function AdvantageCard({ title, description }: AdvantageCardProps) {
    return (
        <div className="flex h-full min-h-[280px] w-full flex-col justify-between rounded-3xl bg-white p-5 shadow-[0_1px_0_rgba(14,22,41,0.04)] md:min-h-[320px] md:p-6">

            <div className="flex justify-start">
                <img loading="lazy" decoding="async" src="/Frame.svg" alt="advantage_icon" className="h-8 w-8 md:h-10 md:w-10" />
            </div>

            <div className="flex flex-col items-start justify-center gap-3">
                <h1 className="text-xl font-semibold leading-tight text-(--text-main) md:text-[28px]">
                    {title}
                </h1>
                <p className="text-sm font-medium leading-6 text-(--text-muted) md:text-[1.125rem]">
                    {description}
                </p>
            </div>

        </div>
    );
}