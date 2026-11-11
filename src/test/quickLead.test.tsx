import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  buildQuickLeadPayload,
  normalizeIndianMobile,
  validateQuickLead,
} from "@/lib/quickLead";

const captureLead = vi.hoisted(() => vi.fn(() => Promise.resolve({ ok: true })));
vi.mock("@/api/leads", () => ({ captureLead }));

import QuickLeadForm from "@/components/leads/QuickLeadForm";

describe("normalizeIndianMobile", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["98765 43210", "9876543210"],
    ["+91 98765-43210", "9876543210"],
    ["919876543210", "9876543210"],
    ["09876543210", "9876543210"],
    ["6000000000", "6000000000"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["987654321", "9 digits"],
    ["98765432100", "11 digits without a leading 0"],
    ["5876543210", "starts with 5"],
    ["0123456789", "landline-style"],
    ["abcdefghij", "letters"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeIndianMobile(input)).toBeNull();
  });
});

describe("validateQuickLead", () => {
  const valid = { name: "Asha Patil", phone: "9876543210", consent: true };

  it("passes a complete submission", () => {
    expect(validateQuickLead(valid)).toEqual({});
  });

  it("requires a name of at least two characters with letters in it", () => {
    expect(validateQuickLead({ ...valid, name: " " }).name).toBeTruthy();
    expect(validateQuickLead({ ...valid, name: "A" }).name).toBeTruthy();
    expect(validateQuickLead({ ...valid, name: "123" }).name).toBeTruthy();
  });

  it("requires a valid Indian mobile", () => {
    expect(validateQuickLead({ ...valid, phone: "12345" }).phone).toBeTruthy();
  });

  it("requires consent", () => {
    expect(validateQuickLead({ ...valid, consent: false }).consent).toBeTruthy();
  });
});

describe("buildQuickLeadPayload", () => {
  it("records page path and intent, splits the name and carries the context", () => {
    const payload = buildQuickLeadPayload(
      { name: "Asha  Rao Patil", phone: "+91 98765 43210" },
      {
        pagePath: "/jee-counselling/",
        intent: "JEE Counselling page",
        source: "GOOGLE",
        landingPage: "/",
        course: "Engineering Counselling",
        exam: "JEE Main",
        interest: "JEE Main",
      },
    );
    expect(payload).toMatchObject({
      phoneNumber: "9876543210",
      firstName: "Asha",
      lastName: "Rao Patil",
      source: "GOOGLE",
      interestedCourseName: "Engineering Counselling",
      interestedExamName: "JEE Main",
    });
    expect(payload.remarks).toContain("/jee-counselling/");
    expect(payload.remarks).toContain("JEE Counselling page");
    // Untouched prefill is not repeated in the remarks.
    expect(payload.remarks).not.toContain("Needs help with");
  });
});

describe("<QuickLeadForm />", () => {
  beforeEach(() => {
    captureLead.mockClear();
    localStorage.clear();
  });

  const renderForm = () =>
    render(
      <MemoryRouter initialEntries={["/engineering-counselling"]}>
        <QuickLeadForm formId="test" intent="Engineering Counselling page" course="Engineering Counselling" />
      </MemoryRouter>,
    );

  const fill = (name: string, phone: string, consent: boolean) => {
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Mobile number"), { target: { value: phone } });
    if (consent) fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /request a call back/i }));
  };

  it("shows errors and sends nothing when the form is invalid", async () => {
    renderForm();
    fill("", "12345", false);
    expect(await screen.findByText("Enter your name")).toBeTruthy();
    expect(screen.getByText("Enter a valid 10-digit mobile number")).toBeTruthy();
    expect(screen.getByText(/please agree/i)).toBeTruthy();
    expect(captureLead).not.toHaveBeenCalled();
  });

  it("captures the lead without login and shows the success state", async () => {
    renderForm();
    fill("Asha Patil", "98765 43210", true);
    await screen.findByText(/we will call you soon/i);
    expect(captureLead).toHaveBeenCalledTimes(1);
    expect(captureLead.mock.calls[0]).toEqual([
      expect.objectContaining({
        phoneNumber: "9876543210",
        interestedCourseName: "Engineering Counselling",
        remarks: expect.stringContaining("/engineering-counselling/"),
      }),
    ]);
    expect(JSON.parse(localStorage.getItem("pc_lead_captured") || "[]")).toContain("9876543210");
  });

  it("does not resend a phone already captured on this device", async () => {
    localStorage.setItem("pc_lead_captured", JSON.stringify(["9876543210"]));
    renderForm();
    fill("Asha Patil", "9876543210", true);
    await waitFor(() => expect(screen.getByText(/we will call you soon/i)).toBeTruthy());
    expect(captureLead).not.toHaveBeenCalled();
  });
});
