import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const TechStack: Story = {
  render: () => (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">TypeScript</Badge>
      <Badge variant="secondary">Next.js</Badge>
      <Badge variant="secondary">React</Badge>
      <Badge variant="secondary">Tailwind</Badge>
    </div>
  ),
};

export const ProjectStatus: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
      >
        Active
      </Badge>
      <Badge
        variant="outline"
        className="border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
      >
        In Progress
      </Badge>
      <Badge
        variant="outline"
        className="border-blue-500/30 bg-blue-500/10 text-blue-500"
      >
        Planned
      </Badge>
    </div>
  ),
};
