// Subtle, on-brand loading state shown while a lazy route chunk loads.
// Replaces the old jarring "Loading..." text with a centered pulsing logo
// and an indeterminate progress bar — feels intentional, not broken.
export default function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-5">
      <img
        src="/logo.svg"
        alt="Loading ProCounsel"
        width={44}
        height={44}
        className="h-11 w-11 animate-pulse"
      />
      <div className="h-[3px] w-36 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full w-1/3 rounded-full bg-[#FA660F]"
          style={{ animation: 'pc-loader-slide 1s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
}
