import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WhatsAppShare from "@/components/predictors/WhatsAppShare";
import { SHARE_TEXT_MAX, buildShareText, buildShareUrl } from "@/lib/predictorShare";

type DL = Window & { dataLayer?: Record<string, unknown>[] };

function shareText(): string {
  const link = screen.getByRole("link", { name: "Share on WhatsApp" });
  const href = link.getAttribute("href") ?? "";
  expect(href.startsWith("https://wa.me/?text=")).toBe(true);
  return decodeURIComponent(href.slice("https://wa.me/?text=".length));
}

afterEach(() => {
  delete (window as DL).dataLayer;
  vi.restoreAllMocks();
});

describe("WhatsAppShare", () => {
  it("links to wa.me with the encoded summary and a UTM-tagged canonical URL", () => {
    render(
      <WhatsAppShare
        summary="My NEET 2025 rank estimate: ~12,345 (score 610). See which MBBS colleges fit your rank:"
        path="/neet-rank-predictor"
        predictor="neet_rank_predictor"
      />,
    );
    const link = screen.getByRole("link", { name: "Share on WhatsApp" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    // Encoded: no raw spaces or ampersands from the message leak into the query.
    expect(link.getAttribute("href")).not.toMatch(/ /);
    expect(link.getAttribute("href")).toContain("%26utm_medium%3Dshare");

    const text = shareText();
    expect(text).toBe(
      "My NEET 2025 rank estimate: ~12,345 (score 610). See which MBBS colleges fit your rank: " +
        "https://procounsel.co.in/neet-rank-predictor/?utm_source=whatsapp&utm_medium=share&utm_campaign=neet_rank_predictor",
    );
    expect(text.length).toBeLessThanOrEqual(SHARE_TEXT_MAX);
  });

  it("carries only what the caller passes — no name, phone or stored details", () => {
    localStorage.setItem("pc_lead_source", "GOOGLE");
    render(<WhatsAppShare summary="Rank ~5,000" path="/jee-rank-predictor" predictor="jee_rank_predictor" />);
    const text = shareText();
    expect(text).not.toMatch(/\d{10}/); // no phone-number-like digits
    expect(text).not.toMatch(/GOOGLE|name|phone/i);
  });

  it("trims long summaries so the whole message stays short", () => {
    const url = buildShareUrl("/neet-college-predictor", "neet_college_predictor");
    const text = buildShareText("x".repeat(500), url);
    expect(text.length).toBeLessThanOrEqual(SHARE_TEXT_MAX);
    expect(text.endsWith(url)).toBe(true);
  });

  it("pushes predictor_share_whatsapp to the dataLayer on click", () => {
    render(<WhatsAppShare summary="Rank ~5,000" path="/jee-rank-predictor" predictor="jee_rank_predictor" />);
    const link = screen.getByRole("link", { name: "Share on WhatsApp" });
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect((window as DL).dataLayer).toContainEqual({
      event: "predictor_share_whatsapp",
      predictor: "jee_rank_predictor",
    });
  });

  it("copies the link, and degrades gracefully when the clipboard is unavailable", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { unmount } = render(
      <WhatsAppShare summary="Rank ~5,000" path="/jee-rank-predictor" predictor="jee_rank_predictor" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(
      "https://procounsel.co.in/jee-rank-predictor/?utm_source=copy_link&utm_medium=share&utm_campaign=jee_rank_predictor",
    );
    unmount();

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(() => Promise.reject(new Error("denied"))) },
      configurable: true,
    });
    render(<WhatsAppShare summary="Rank ~5,000" path="/jee-rank-predictor" predictor="jee_rank_predictor" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/couldn't copy/i));
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
  });
});
