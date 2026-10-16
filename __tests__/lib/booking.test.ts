// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const analytics = vi.hoisted(() => ({
  track: vi.fn(),
  trackAdConversion: vi.fn(),
}));

vi.mock("@/lib/analytics/track", () => ({
  track: analytics.track,
  getAttribution: () => ({ utm_campaign: "paying" }),
  getPageContext: () => ({ landing_slug: "ai", variant: "default" }),
}));
vi.mock("@/lib/analytics/ads", () => ({
  trackAdConversion: analytics.trackAdConversion,
}));

import { resetProcessedBookings } from "@/lib/analytics/calendly";
import { installInteractionTracking } from "@/lib/analytics/dom";

const INVITEE =
  "https://api.calendly.com/scheduled_events/EVT12345678/invitees/INV12345678";

/** The popup's iframe, as Calendly's widget renders it. */
function calendlyFrame(): Window {
  const overlay = document.createElement("div");
  overlay.className = "calendly-overlay";
  const frame = document.createElement("iframe");
  frame.src = "https://calendly.com/leogcode-dev/30min?embed_type=PopupText";
  overlay.appendChild(frame);
  document.body.appendChild(overlay);
  return frame.contentWindow!;
}

function post(
  source: Window | null,
  data: unknown,
  origin = "https://calendly.com",
) {
  window.dispatchEvent(new MessageEvent("message", { origin, source, data }));
}

const scheduled = (payload?: unknown) => ({
  event: "calendly.event_scheduled",
  payload,
});

describe("Calendly booking messages", () => {
  let uninstall: () => void;

  beforeEach(() => {
    uninstall = installInteractionTracking();
    analytics.track.mockReset();
    analytics.trackAdConversion.mockReset();
  });

  afterEach(() => {
    uninstall();
    resetProcessedBookings();
    document.body.innerHTML = "";
  });

  it("sends one booking, with one id everywhere, however often it is replayed", () => {
    const source = calendlyFrame();
    const message = scheduled({ invitee: { uri: INVITEE } });
    post(source, message);
    post(source, message);
    post(source, structuredClone(message));

    const bookings = analytics.track.mock.calls.filter(
      ([event]) => event === "booking_scheduled",
    );
    expect(bookings).toHaveLength(1);
    expect(bookings[0][1]).toMatchObject({
      booking_id: "INV12345678",
      landing_slug: "ai",
      utm_campaign: "paying",
    });
    expect(analytics.trackAdConversion).toHaveBeenCalledTimes(1);
    expect(analytics.trackAdConversion).toHaveBeenCalledWith(
      "booking",
      "INV12345678",
    );
  });

  it("sends nothing for a booking without an id", () => {
    const source = calendlyFrame();
    post(source, scheduled());
    post(source, scheduled({ invitee: {}, event: {} }));
    expect(analytics.track).not.toHaveBeenCalled();
    expect(analytics.trackAdConversion).not.toHaveBeenCalled();
  });

  it("ignores messages from anything but the Calendly iframe on the page", () => {
    calendlyFrame();
    const message = scheduled({ invitee: { uri: INVITEE } });
    post(window, message);
    post(null, message);
    post(calendlyFrame(), message, "https://evil.example");
    expect(analytics.track).not.toHaveBeenCalled();
    expect(analytics.trackAdConversion).not.toHaveBeenCalled();
  });
});
