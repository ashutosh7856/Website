import { describe, it, expect } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Stories from "@/components/Revamp/probuddies/Stories";
import StoriesCard, { type StoryItem } from "@/components/Revamp/probuddies/StoriesCard";
import AppInstallBanner from "@/components/shared/AppInstallBanner";
import CollegeBannerCard from "@/components/college/CollegeBannerCard";
import { demoteBodyHeadings, dropRedundantLeadingHeading } from "@/lib/blogHtml";
import { buildCityContent, COUNSELLING_CITIES } from "@/lib/counsellingCities";

/**
 * Duplicate-content guards.
 *
 * The AdSense review flagged "duplicate testimonials/content" on the home page.
 * The cause was a pattern repeated all over this codebase: a component renders
 * the SAME text twice — once in a `md:hidden` block and once in a
 * `hidden md:block` block — and relies on CSS to hide one copy. Users see one;
 * crawlers read the markup and see both.
 *
 * These tests assert on the rendered DOM, which is what a crawler consumes, so
 * a re-introduced mobile/desktop double-render fails here rather than in a
 * review six weeks later.
 */

// Counts how many DOM text nodes contain `needle`. `getAllByText` normalises and
// matches whole elements, which misses text split across nested tags — walking
// text nodes is what actually mirrors "how many times is this in the HTML".
function countInDom(container: HTMLElement, needle: string): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let count = 0;
  let node = walker.nextNode();
  while (node) {
    if ((node.textContent ?? "").includes(needle)) count += 1;
    node = walker.nextNode();
  }
  return count;
}

const STORY: StoryItem = {
  name: "Ashutosh",
  role: "Student",
  rating: 4,
  headline: "Weekly targets kept my prep on track",
  text: "The course planning was clear and easy to follow.",
  image: "/review1.webp",
};

describe("testimonials are served once, not twice", () => {
  it("renders each field of a story card exactly once in the DOM", () => {
    const { container } = render(<StoriesCard active={false} story={STORY} />);

    expect(countInDom(container, STORY.name)).toBe(1);
    expect(countInDom(container, STORY.role)).toBe(1);
    expect(countInDom(container, STORY.text)).toBe(1);
    expect(countInDom(container, STORY.headline!)).toBe(1);
  });

  it("does not ship the old hard-coded headline that was identical on every card", () => {
    const { container } = render(<StoriesCard active story={STORY} />);
    expect(container.textContent).not.toContain("It was a very good experience");
  });

  it("keeps exactly one copy of every quote when the whole section renders", () => {
    const stories: StoryItem[] = [
      { ...STORY, name: "Ashutosh", text: "Quote one about weekly targets." },
      { ...STORY, name: "Ananya", text: "Quote two about doubt sessions." },
      { ...STORY, name: "Shubham", text: "Quote three about speed and accuracy." },
    ];

    const { container } = render(<Stories stories={stories} />);

    for (const story of stories) {
      expect(countInDom(container, story.text)).toBe(1);
      expect(countInDom(container, story.name)).toBe(1);
    }
  });

  it("gives each testimonial its own headline, so no sentence repeats", () => {
    const stories: StoryItem[] = [
      { ...STORY, name: "A", headline: "First headline" },
      { ...STORY, name: "B", headline: "Second headline" },
      { ...STORY, name: "C", headline: "Third headline" },
    ];

    render(<Stories stories={stories} />);

    const headlines = stories.map((s) => s.headline);
    expect(new Set(headlines).size).toBe(headlines.length);
    for (const headline of headlines) {
      expect(screen.getAllByText(headline!)).toHaveLength(1);
    }
  });

  it("renders no testimonial section at all rather than an empty placeholder", () => {
    const { container } = render(<Stories stories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses a card-level heading, not a second <h1> competing with the page title", () => {
    const { container } = render(<StoriesCard active={false} story={STORY} />);
    expect(container.querySelectorAll("h1")).toHaveLength(0);
    expect(container.querySelector("h3")?.textContent).toBe(STORY.name);
  });
});

describe("app install banner", () => {
  // The banner waits until the visitor scrolls past the first screen.
  const renderBanner = () => {
    const view = render(
      <MemoryRouter initialEntries={["/"]}>
        <AppInstallBanner />
      </MemoryRouter>,
    );
    Object.defineProperty(window, "scrollY", { value: 800, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    return view;
  };

  it("stays out of the way until the visitor scrolls", () => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AppInstallBanner />
      </MemoryRouter>,
    );
    expect(countInDom(container, "Experience the features on the app from anywhere")).toBe(0);
  });

  it("ships its copy once, not once per breakpoint", () => {
    const { container } = renderBanner();
    // This string used to appear twice on all 210 pages of the site, because a
    // second copy sat in a block that was `hidden` with no responsive variant —
    // permanently invisible markup that crawlers still read.
    expect(countInDom(container, "Experience the features on the app from anywhere")).toBe(1);
  });

  it("has no permanently-hidden block left behind", () => {
    const { container } = renderBanner();
    // `className` is an SVGAnimatedString on SVG nodes, so read the attribute.
    const alwaysHidden = [...container.querySelectorAll<Element>("[class]")].filter((el) => {
      const classes = (el.getAttribute("class") ?? "").split(/\s+/);
      return (
        classes.includes("hidden") &&
        !classes.some((c) => /^(sm|md|lg|xl|2xl):(block|flex|grid|inline)/.test(c))
      );
    });
    expect(alwaysHidden).toEqual([]);
  });
});

describe("heading structure on indexed pages", () => {
  it("college banner card does not emit a second <h1>", () => {
    const { container } = render(
      <CollegeBannerCard name="College of Engineering Pune" location="Pune, Maharashtra" />,
    );
    expect(container.querySelectorAll("h1")).toHaveLength(0);
    expect(container.querySelector("h2")?.textContent).toBe("College of Engineering Pune");
  });

  it("demotes an <h1> inside author-written blog HTML so the post keeps one h1", () => {
    const authored = '<h1><strong>How to Start a Career in Data Analytics</strong></h1><p>Body.</p>';
    const out = demoteBodyHeadings(authored);

    expect(out).not.toMatch(/<h1[\s>]/i);
    expect(out).not.toMatch(/<\/h1>/i);
    expect(out).toContain("<h2>");
    expect(out).toContain("How to Start a Career in Data Analytics");
  });

  it("leaves other heading levels and attributes alone", () => {
    const out = demoteBodyHeadings('<h1 id="x" class="y">T</h1><h2>Sub</h2><h3>Deep</h3>');
    expect(out).toBe('<h2 id="x" class="y">T</h2><h2>Sub</h2><h3>Deep</h3>');
  });

  it("drops a leading body heading that just restates the post title", () => {
    const title = "How to Start a Career in Data Analytics";
    const body = "<h2><strong>How to Start a Career in Data Analytics: A Complete Beginner Guide</strong></h2><p>Body.</p>";

    expect(dropRedundantLeadingHeading(body, title)).toBe("<p>Body.</p>");
  });

  it("keeps a leading heading that says something different", () => {
    const body = "<h2>Why data analytics is booming in 2026</h2><p>Body.</p>";
    expect(dropRedundantLeadingHeading(body, "How to Start a Career in Data Analytics")).toBe(body);
  });

  it("only ever drops the first heading, never body headings further down", () => {
    const title = "Study Abroad";
    const body = "<p>Intro.</p><h2>Study Abroad</h2><p>More.</p>";
    expect(dropRedundantLeadingHeading(body, title)).toBe(body);
  });
});

describe("city counselling pages", () => {
  it("never repeats the page H1 verbatim as a section heading", () => {
    for (const city of COUNSELLING_CITIES) {
      const content = buildCityContent(city);
      const headings = content.sections.map((s) => s.heading);
      expect(headings, `${city.city}: a section heading duplicates the H1`).not.toContain(content.h1);
    }
  });

  it("gives every city a distinct H1", () => {
    const h1s = COUNSELLING_CITIES.map((city) => buildCityContent(city).h1);
    expect(new Set(h1s).size).toBe(h1s.length);
  });
});
