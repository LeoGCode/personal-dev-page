import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProjectCard } from "./project-card";

const meta = {
  title: "Components/ProjectCard",
  component: ProjectCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    slug: "nexora",
    name: "Nexora",
    description:
      "AI-powered business management platform for small teams and solopreneurs.",
    stack: ["Next.js", "Django", "PostgreSQL", "Docker"],
    status: "active",
    statusLabel: "Active",
    url: "https://nexoragroup.com",
  },
};

export const InProgress: Story = {
  args: {
    slug: "ai-credit-analyzer",
    name: "AI Credit Analyzer",
    description:
      "Machine learning hybrid system for credit risk analysis and scoring.",
    stack: ["Python", "TensorFlow", "FastAPI", "React"],
    status: "in_progress",
    statusLabel: "In Progress",
  },
};

export const Planned: Story = {
  args: {
    slug: "openclaw",
    name: "OpenClaw",
    description:
      "Open-source Android accessibility app for users with motor disabilities.",
    stack: ["Kotlin", "Android", "Accessibility APIs"],
    status: "planned",
    statusLabel: "Planned",
  },
};

export const LongDescription: Story = {
  args: {
    slug: "esthetician",
    name: "Esthetician Platform",
    description:
      "Full-stack beauty professional platform with booking, payments, SMS reminders, referral program, email campaigns, and client management. Built for independent estheticians to manage their entire business.",
    stack: [
      "Next.js",
      "Django",
      "PostgreSQL",
      "Stripe",
      "Celery",
      "Redis",
      "Docker",
    ],
    status: "active",
    statusLabel: "Active",
    url: "https://boggbeautystudios.com",
  },
};

export const WithExternalLink: Story = {
  args: {
    slug: "nexora",
    name: "Nexora",
    description: "Business management platform with external link.",
    stack: ["Next.js", "TypeScript"],
    status: "active",
    statusLabel: "Active",
    url: "https://nexoragroup.com",
  },
};

export const WithoutExternalLink: Story = {
  args: {
    slug: "openclaw",
    name: "OpenClaw",
    description: "Open-source project without an external link.",
    stack: ["Kotlin", "Android"],
    status: "planned",
    statusLabel: "Planned",
  },
};
