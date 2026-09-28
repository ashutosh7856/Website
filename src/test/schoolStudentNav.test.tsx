import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RevampHeader from "@/components/Revamp/RevampHeader";
import RevampLayout from "@/layouts/RevampLayout";
import { useAuthStore } from "@/store/AuthStore";
import type { User } from "@/types/user";

/**
 * School students do not live in the site layout — they get their own shell.
 *
 * The redirect is at RENDER time, not in an effect, so the site header and
 * footer are never painted for them, not even for one frame. These tests pin
 * that, and pin that a normal user's header is completely untouched by it.
 */

const asUser = (role: string, name = "Aarav"): User =>
  ({
    userName: "8000000000",
    firstName: name,
    lastName: "Kumar",
    phoneNumber: "8000000000",
    email: "",
    role,
    verified: false,
    walletAmount: 0,
    transactions: [],
    offlineTransactions: [],
    activityLog: [],
    userInterestedStateOfCounsellors: null,
    interestedCourse: null,
  } as unknown as User);

const signIn = (role: string) => {
  localStorage.setItem("jwt", "jwt-test");
  useAuthStore.setState({
    user: asUser(role),
    userId: "8000000000",
    role: role as never,
    isAuthenticated: true,
  });
};

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    userId: null,
    role: null,
    isAuthenticated: false,
  });
});

const renderSiteLayout = (at = "/admissions") =>
  render(
    <MemoryRouter initialEntries={[at]}>
      <Routes>
        <Route element={<RevampLayout />}>
          <Route path="/admissions" element={<div>site content</div>} />
          <Route path="/courses" element={<div>courses content</div>} />
        </Route>
        <Route path="/school-student/dashboard" element={<div>school shell</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("a school student never renders the site layout", () => {
  beforeEach(() => signIn("schoolStudent"));

  it("is handed straight to their own shell", () => {
    renderSiteLayout();
    expect(screen.getByText("school shell")).toBeInTheDocument();
  });

  it("never paints the site header, search or footer", () => {
    renderSiteLayout();

    expect(screen.queryByPlaceholderText(/search courses/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument();
    expect(screen.queryByText("site content")).not.toBeInTheDocument();
  });

  it("is redirected from any site route, not just the home page", () => {
    renderSiteLayout("/courses");
    expect(screen.getByText("school shell")).toBeInTheDocument();
    expect(screen.queryByText("courses content")).not.toBeInTheDocument();
  });
});

describe("what must not change — the site layout for everyone else", () => {
  it("renders normally for a signed-in user", () => {
    signIn("user");
    renderSiteLayout();
    expect(screen.getByText("site content")).toBeInTheDocument();
  });

  it("renders normally for a logged-out visitor", () => {
    renderSiteLayout();
    expect(screen.getByText("site content")).toBeInTheDocument();
  });
});

describe("what must not change — the site header's own menu", () => {
  const renderHeader = () =>
    render(
      <MemoryRouter initialEntries={["/admissions"]}>
        <RevampHeader />
      </MemoryRouter>,
    );

  const openMenu = async () => {
    const [avatar] = screen.getAllByRole("button", { name: "Account menu" });
    await userEvent.click(avatar);
  };

  beforeEach(() => signIn("user"));

  it("keeps the full primary navigation", () => {
    renderHeader();

    const hrefs = new Set(
      screen.getAllByRole("link").map((el) => el.getAttribute("href")),
    );
    expect(hrefs.has("/admissions")).toBe(true);
    expect(hrefs.has("/colleges")).toBe(true);
    expect(hrefs.has("/pro-buddies")).toBe(true);
    expect(hrefs.has("/study-abroad")).toBe(true);
    expect(hrefs.has("/courses")).toBe(false);
    expect(hrefs.has("/community")).toBe(false);
  });

  it("keeps the full avatar menu", async () => {
    renderHeader();
    await openMenu();

    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live Sessions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Courses" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
