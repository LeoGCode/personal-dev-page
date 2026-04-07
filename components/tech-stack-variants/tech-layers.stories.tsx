import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TechLayers from "./tech-layers";
import {
  allSkills,
  defaultGetCategoryLabel,
  defaultLevelLabels,
} from "./shared";

const meta: Meta<typeof TechLayers> = {
  title: "Components/TechStack Variants/Layers",
  component: TechLayers,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof TechLayers>;

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
