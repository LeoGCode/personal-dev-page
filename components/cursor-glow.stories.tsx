import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CursorGlow } from "./cursor-glow";

const meta = {
  title: "Effects/CursorGlow",
  component: CursorGlow,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof CursorGlow>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default — full interactive demo ── */

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="relative min-h-[700px] bg-background text-foreground">
          <Story />

          <div className="relative z-10 flex min-h-[700px] flex-col items-center justify-center gap-10 px-8">
            {/* heading */}
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
                {"// move · hover · click"}
              </span>
              <h2 className="font-mono text-4xl font-bold tracking-tight">
                Custom Cursor <span className="text-primary">Effect</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Fluid trail · magnetic ring · click particles · hover labels.
                <br />
                Try hovering and clicking the cards below.
              </p>
            </div>

            {/* interactive cards with data-cursor labels */}
            <div className="flex flex-wrap justify-center gap-5">
              {[
                { label: "Projects", icon: "◆", desc: "View my work" },
                { label: "About", icon: "●", desc: "Who I am" },
                { label: "Contact", icon: "▲", desc: "Get in touch" },
              ].map((item) => (
                <div
                  key={item.label}
                  data-cursor={item.label}
                  className="flex w-44 flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-7 text-center transition-colors duration-300 hover:border-primary/40 hover:bg-card/80"
                >
                  <span className="text-2xl text-primary">{item.icon}</span>
                  <span className="font-mono text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* clickable button */}
            <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Click me for particles
            </button>

            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase">
              click anywhere for ripple + particles
            </span>
          </div>
        </div>
      </div>
    ),
  ],
};

/* ── Dense content — stress test with card grid ── */

export const WithDenseContent: Story = {
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="relative min-h-[700px] bg-background text-foreground">
          <Story />

          <div className="relative z-10 flex min-h-[700px] flex-col gap-8 p-8">
            <div className="text-center">
              <h2 className="font-mono text-2xl font-bold tracking-tight">
                Dense Layout Test
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The canvas overlays content without blocking any interaction.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  data-cursor={`Card ${i + 1}`}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-colors duration-200 hover:border-primary/30"
                >
                  <h3 className="font-mono text-sm font-semibold">
                    Card {i + 1}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Hover for label, click for particles. All interactions pass
                    through the canvas layer.
                  </p>
                  <button className="mt-auto self-start rounded-md bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-secondary/80">
                    Action
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  ],
};
