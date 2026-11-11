import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import StudyAbroad from "@/pages/StudyAbroad";
import {
  DESTINATIONS,
  PROCESS,
  STUDY_ABROAD_FAQS,
  STUDY_ABROAD_SECTIONS,
} from "@/lib/studyAbroad";

/**
 * /study-abroad is a paid-traffic landing page, so two things have to hold at
 * once: it must be indexable on its own content (no API, real copy, one H1,
 * self-canonical, FAQ schema), and the single form on it must reach the CRM
 * with the countries the visitor actually picked. Both are pinned here.
 */

const captureLead = vi.hoisted(() =>
  vi.fn((payload: Record<string, unknown>) => Promise.resolve({ status: "Success", payload })),
);
vi.mock("@/api/leads", () => ({ captureLead }));

const createForeignStudent = vi.hoisted(() =>
  vi.fn((payload: Record<string, unknown>) => Promise.resolve({ status: "Success", payload })),
);
vi.mock("@/api/foreignStudent", () => ({ createForeignStudent }));

const SITE = "https://procounsel.co.in";

/**
 * jsdom has no IntersectionObserver, and the page uses one to decide when the
 * phone-only floating CTA is needed. This stub hands the test the callback so
 * it can say whether the form is on screen.
 */
let intersect: ((entries: { isIntersecting: boolean }[]) => void) | undefined;

class TestIntersectionObserver {
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    intersect = callback;
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  intersect = undefined;
  vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
});

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/study-abroad"]}>
        <Routes>
          <Route path="/study-abroad" element={<StudyAbroad />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

const head = (selector: string) => Array.from(document.head.querySelectorAll(selector));

describe("study abroad — content is real, not a stub", () => {
  it("carries enough copy to stand on its own in search", () => {
    const words = [
      ...STUDY_ABROAD_SECTIONS.flatMap((s) => [
        s.heading,
        ...(s.paragraphs ?? []),
        ...(s.bullets ?? []),
      ]),
      ...STUDY_ABROAD_FAQS.flatMap((f) => [f.question, f.answer]),
      ...DESTINATIONS.flatMap((d) => [d.headline, d.watchOut, d.workRights]),
      ...PROCESS.flatMap((p) => [p.body, ...p.works]),
    ]
      .filter(Boolean)
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;

    expect(words).toBeGreaterThan(1200);
    expect(STUDY_ABROAD_FAQS.length).toBeGreaterThanOrEqual(8);
    expect(STUDY_ABROAD_SECTIONS.length).toBeGreaterThanOrEqual(6);
  });

  it("gives every destination a distinct slug and the full comparison row", () => {
    const slugs = DESTINATIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const d of DESTINATIONS) {
      for (const field of ["name", "short", "flag", "headline", "tuition", "tuitionNote", "living", "stayBack", "stayBackNote", "workRights", "tests", "watchOut"] as const) {
        expect(d[field].trim(), `${d.slug}.${field}`).not.toBe("");
      }
      expect(d.popular.length, `${d.slug}.popular`).toBeGreaterThan(2);
      // Intakes are chips on the board, so each one has to be a short month
      // label rather than a sentence.
      expect(d.intakes.length, `${d.slug}.intakes`).toBeGreaterThan(0);
      for (const month of d.intakes) expect(month.length).toBeLessThanOrEqual(8);
    }
  });

  it("asks no duplicate FAQ questions", () => {
    const qs = STUDY_ABROAD_FAQS.map((f) => f.question);
    expect(new Set(qs).size).toBe(qs.length);
  });
});

describe("study abroad — rendered head and DOM", () => {
  it("renders exactly one H1", async () => {
    renderPage();
    await waitFor(() => {
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent).toContain("Study abroad");
    });
  });

  it("self-canonicalises and stays indexable", async () => {
    renderPage();
    await waitFor(() => {
      const canonical = head('link[rel="canonical"]');
      expect(canonical).toHaveLength(1);
      expect(canonical[0].getAttribute("href")).toBe(`${SITE}/study-abroad/`);

      const robots = head('meta[name="robots"]')[0]?.getAttribute("content") ?? "";
      expect(robots).toContain("index,follow");
      expect(robots).not.toContain("noindex");

      const description = head('meta[name="description"]')[0]?.getAttribute("content") ?? "";
      expect(description.length).toBeGreaterThanOrEqual(110);
      expect(description.length).toBeLessThanOrEqual(180);
    });
  });

  it("emits Service, FAQPage and BreadcrumbList schema", async () => {
    renderPage();
    await waitFor(() => {
      const graph = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((el) => JSON.parse(el.textContent ?? "null"))
        .flatMap((b) => (Array.isArray(b) ? b : [b]));

      expect(graph.find((n) => n?.["@type"] === "Service")).toBeTruthy();

      const faqPage = graph.find((n) => n?.["@type"] === "FAQPage");
      expect(faqPage.mainEntity.map((q: { name: string }) => q.name)).toEqual(
        STUDY_ABROAD_FAQS.map((f) => f.question),
      );

      const crumbs = graph.find((n) => n?.["@type"] === "BreadcrumbList");
      expect(crumbs.itemListElement.at(-1).item).toBe(`${SITE}/study-abroad/`);
    });
  });

  it("puts every destination, service, step and FAQ in the DOM for a crawler", async () => {
    renderPage();
    await waitFor(() => {
      const text = document.body.textContent ?? "";
      for (const d of DESTINATIONS) expect(text).toContain(`Study in ${d.name}`);
      for (const p of PROCESS) {
        expect(text).toContain(p.title);
        for (const w of p.works) expect(text).toContain(w);
      }
      for (const f of STUDY_ABROAD_FAQS) expect(text).toContain(f.question);
    });
  });

  it("keeps exactly one lead form on the page", async () => {
    const { container } = renderPage();
    await waitFor(() => {
      expect(container.querySelectorAll("form")).toHaveLength(1);
    });
  });
});

describe("study abroad — the lead form", () => {
  const fillRequired = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText("Full name"), "Ananya Sharma");
    await user.type(screen.getByLabelText("Mobile number"), "9876543210");
    await user.type(screen.getByLabelText("Email"), "ananya@example.com");
  };

  it("will not submit without the countries the desk needs to route the lead", async () => {
    const user = userEvent.setup();
    renderPage();
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: /book my free session/i }));

    expect(createForeignStudent).not.toHaveBeenCalled();
    expect(await screen.findByText("Pick at least one country")).toBeInTheDocument();
  });

  it("carries a destination added from its card through to the CRM payload", async () => {
    const user = userEvent.setup();
    renderPage();

    // Tick it on the board, not in the form: the board is the page's main
    // country picker and it writes into the same selection the form reads.
    await user.click(screen.getByRole("checkbox", { name: /Canada/ }));

    // The matching chip inside the form is now pressed.
    const form = document.querySelector("form")!;
    // The flag is aria-hidden, so the chip's accessible name is the country.
    const chip = within(form).getByRole("button", { name: "Canada" });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    await fillRequired(user);
    await user.selectOptions(screen.getByLabelText("When do you want to start?"), "September 2027");
    await user.click(screen.getByRole("button", { name: /book my free session/i }));

    await waitFor(() => expect(createForeignStudent).toHaveBeenCalledTimes(1));
    expect(createForeignStudent.mock.calls[0][0]).toMatchObject({
      name: "Ananya Sharma",
      phone: "9876543210",
      email: "ananya@example.com",
      qualification: "12th",
      interestedCountry: "Canada",
      startYear: "2027",
    });

    // The answers with no column of their own still travel, so nothing the
    // visitor typed is thrown away on the way to the desk.
    const remarks = String(createForeignStudent.mock.calls[0][0].remarks);
    expect(remarks).toContain("Countries: Canada");
    expect(remarks).toContain("Intake: September 2027");

    // Study abroad and the counselling CRM are worked by different desks, so a
    // lead from this page never reaches the other queue.
    expect(captureLead).not.toHaveBeenCalled();

    // And the visitor is told what happens next rather than left on the form.
    expect(await screen.findByText(/Session booked, Ananya/)).toBeInTheDocument();
  });

  it("offers a floating CTA on phones once the form has scrolled away", async () => {
    const user = userEvent.setup();
    renderPage();

    // The itinerary carries a link with the same wording — one action, one
    // name — so the floating one is counted rather than matched by text.
    const ctas = () => screen.getAllByRole("link", { name: /book a free session/i });
    const floating = () => ctas().find((el) => el.className.includes("fixed"));

    // The form is on screen at first: a second call to action would be noise.
    expect(floating()).toBeUndefined();

    act(() => intersect?.([{ isIntersecting: false }]));
    expect(floating()).toHaveAttribute("href", "#lead-form");

    act(() => intersect?.([{ isIntersecting: true }]));
    expect(floating()).toBeUndefined();

    // And it never asks a visitor to book something they have already booked.
    act(() => intersect?.([{ isIntersecting: false }]));
    await user.click(screen.getByRole("checkbox", { name: /Germany/ }));
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: /book my free session/i }));
    await waitFor(() => expect(floating()).toBeUndefined());
  });

  it("asks the visitor to resend when the write fails, and never files it as a CRM lead", async () => {
    // A study abroad enquiry belongs to the study abroad desk. Quietly parking
    // a failed one in the counselling CRM would put it in front of people who
    // cannot help this student, so the form asks for it again instead.
    createForeignStudent.mockRejectedValueOnce(new Error("HTTP 401"));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("checkbox", { name: /United Kingdom/ }));
    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: /book my free session/i }));

    await waitFor(() => expect(createForeignStudent).toHaveBeenCalledTimes(1));
    expect(captureLead).not.toHaveBeenCalled();
    expect(screen.queryByText(/Session booked/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /book my free session/i })).toBeEnabled();
  });
});
