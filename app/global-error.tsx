"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              Something went wrong!
            </h1>
            <p style={{ marginTop: "0.5rem", color: "#888" }}>
              An unexpected error occurred.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1rem",
                border: "1px solid #333",
                borderRadius: "0.375rem",
                cursor: "pointer",
                background: "transparent",
                color: "inherit",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
