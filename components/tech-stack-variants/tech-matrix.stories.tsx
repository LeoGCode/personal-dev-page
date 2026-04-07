import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TechMatrix from "./tech-matrix";
import {
  allSkills,
  defaultGetCategoryLabel,
  defaultLevelLabels,
} from "./shared";

const meta: Meta<typeof TechMatrix> = {
  title: "Components/TechStack Variants/7 — Matrix",
  component: TechMatrix,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof TechMatrix>;

export const Default: Story = {
  args: {
    skills: allSkills,
    getCategoryLabel: defaultGetCategoryLabel,
    levelLabels: defaultLevelLabels,
  },
};

export const DarkBackground: Story = {
  args: {
    skills: allSkills,
    getCategoryLabel: defaultGetCategoryLabel,
    levelLabels: defaultLevelLabels,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-background min-h-screen">
        <Story />
      </div>
    ),
  ],
};
