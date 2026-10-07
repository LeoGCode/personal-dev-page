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
import type { ComponentProps } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const mocks = vi.hoisted(() => ({
  capture: vi.fn(),
  site: {
    BOOKING_URL: "https://calendly.com/leogcode-dev/30min",
    AI_PACKAGES_URL: "https://exprime.nexoragroup.dev",
    WHATSAPP_NUMBER: "",
  },
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: mocks.capture }),
}));

vi.mock("@/lib/site", () => mocks.site);

// next-intl's Link needs the Next.js router; a locale-prefixed <a> is enough
// to assert where it points.
vi.mock("@/lib/i18n/navigation", () => ({
  Link: ({ href, ...props }: ComponentProps<"a">) => (
    <a href={`/en${href}`} {...props} />
  ),
}));

import { AiSetup } from "@/components/ai-setup";

type Messages = typeof en;

function renderPage(locale: "en" | "es" = "en", messages: Messages = en) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AiSetup />
    </NextIntlClientProvider>,
  );
}

function withPrice(price: string): Messages {
  return {
    ...en,
    ai_setup: { ...en.ai_setup, offer: { ...en.ai_setup.offer, price } },
  };
}

// motion's whileInView (AnimateInView) needs IntersectionObserver.
beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

describe("AiSetup page", () => {
  beforeEach(() => {
    mocks.capture.mockReset();
    mocks.site.WHATSAPP_NUMBER = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the hero and points both booking CTAs at Calendly", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /already pay for/i }),
    ).toBeInTheDocument();
    const bookingLinks = screen.getAllByRole("link", {
      name: /book the free 30-min call/i,
    });
    expect(bookingLinks).toHaveLength(2);
    for (const link of bookingLinks) {
      expect(link).toHaveAttribute(
        "href",
        "https://calendly.com/leogcode-dev/30min",
      );
    }
  });

  it("links the contact form with the ai_setup type pre-selected", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: /send me a message/i }),
    ).toHaveAttribute("href", "/en/collaborate?type=ai_setup");
  });

  it("links the full packages on Exprime in the visitor's language", () => {
    renderPage("es", es as Messages);

    expect(
      screen.getByRole("link", { name: /ver todos los paquetes/i }),
    ).toHaveAttribute("href", "https://exprime.nexoragroup.dev/es#packages");
  });

  it("hides the WhatsApp button while no number is configured", () => {
    renderPage();

    expect(
      screen.queryByRole("link", { name: /whatsapp/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a wa.me link with a pre-filled message when a number is set", () => {
    mocks.site.WHATSAPP_NUMBER = "12145550123";
    renderPage("es", es as Messages);

    const links = screen.getAllByRole("link", { name: /whatsapp/i });
    expect(links).toHaveLength(2);
    const url = new URL(links[0].getAttribute("href")!);
    expect(url.origin + url.pathname).toBe("https://wa.me/12145550123");
    expect(url.searchParams.get("text")).toBe(es.ai_setup.whatsapp_message);
  });

  it("shows the founding price from the dictionary, and hides it when empty", () => {
    renderPage();
    expect(screen.getByText(en.ai_setup.offer.price)).toBeInTheDocument();
    cleanup();

    renderPage("en", withPrice(""));
    expect(screen.queryByText(/at cost/i)).not.toBeInTheDocument();
    expect(screen.getByText(/5 spots for people I know/i)).toBeInTheDocument();
  });

  it("tracks CTA clicks in PostHog", async () => {
    const user = userEvent.setup();
    renderPage();

    const [heroBooking] = screen.getAllByRole("link", {
      name: /book the free 30-min call/i,
    });
    // Keep jsdom from attempting the navigation.
    heroBooking.addEventListener("click", (event) => event.preventDefault());
    await user.click(heroBooking);

    expect(mocks.capture).toHaveBeenCalledWith("ai_page_cta_clicked", {
      cta: "book_call",
      placement: "hero",
      url: "https://calendly.com/leogcode-dev/30min",
      locale: "en",
    });
  });
});
