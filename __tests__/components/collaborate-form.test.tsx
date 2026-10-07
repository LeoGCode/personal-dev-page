// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/dictionaries/en.json";
import { CollaborateForm } from "@/components/collaborate-form";
import { SITE_EMAIL } from "@/lib/site";

vi.mock("posthog-js/react", () => ({ usePostHog: () => undefined }));

// Radix Select relies on pointer-capture and scrolling APIs jsdom lacks.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CollaborateForm />
    </NextIntlClientProvider>,
  );
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/your name/i), "Jane Doe");
  await user.type(screen.getByLabelText(/^email/i), "jane@example.com");
  await user.click(
    screen.getByRole("combobox", { name: /what are you looking for/i }),
  );
  await user.click(
    await screen.findByRole("option", { name: /technical consulting/i }),
  );
  await user.type(
    screen.getByLabelText(/tell me about/i),
    "I need help connecting my AI to my inbox and calendar.",
  );
  await user.click(screen.getByRole("button", { name: /send message/i }));
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CollaborateForm submission states", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  // Vitest globals are off, so Testing Library cannot auto-cleanup.
  afterEach(() => {
    cleanup();
  });

  it("shows success only when the API confirms delivery", async () => {
    const fetchMock = mockFetch(200, { success: true });
    renderForm();

    await fillAndSubmit();

    expect(await screen.findByText(/message sent/i)).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      collaborationType: "consulting",
      locale: "en",
    });
  });

  it("shows an error with a direct email fallback when the lead was not delivered", async () => {
    mockFetch(502, { error: "Lead could not be delivered" });
    renderForm();

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/wasn't sent/i);
    expect(alert).toHaveTextContent(/didn't reach me/i);
    expect(
      screen.getByRole("link", { name: SITE_EMAIL }).getAttribute("href"),
    ).toBe(`mailto:${SITE_EMAIL}`);
    expect(screen.queryByText(/message sent/i)).not.toBeInTheDocument();
  });

  it("explains the rate limit instead of a generic failure", async () => {
    mockFetch(429, { error: "Too many requests. Please try again later." });
    renderForm();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /too many messages/i,
    );
  });

  it("shows an error when the network request itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderForm();

    await fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/wasn't sent/i);
  });
});
