import { Link } from 'react-router-dom';

/** Entry point to the test builder (/mba/mocks/build) from Practice and Mock tests. */
export default function BuildTestLink() {
  return (
    <Link
      to="/mba/mocks/build"
      className="ss-panel flex items-center justify-between gap-3 p-4 font-[Poppins] text-[13px] text-[var(--ink)] hover:opacity-90"
    >
      <span>
        <span className="block font-semibold">Build a test</span>
        <span className="block text-[12px] text-[var(--neutral-500)]">
          A 15-min Quant drill, a weak-topics set, or your own mix — timed and scored like CAT.
        </span>
      </span>
      <span className="btn-secondary shrink-0 px-4 py-2 text-[12px] font-semibold">Build</span>
    </Link>
  );
}
