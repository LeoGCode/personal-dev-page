import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Badge } from "./badge";
import { Button } from "./button";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
    </Card>
  ),
};

export const ProjectCard: Story = {
  render: () => (
    <Card className="flex w-[350px] flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-lg">Nexora</CardTitle>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
          >
            Active
          </Badge>
        </div>
        <CardDescription className="mt-2 leading-relaxed">
          AI-powered business management platform for small teams.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs font-normal">
            Next.js
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            Django
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal">
            PostgreSQL
          </Badge>
        </div>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Check your inbox for the latest updates.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View All</Button>
      </CardFooter>
    </Card>
  ),
};
