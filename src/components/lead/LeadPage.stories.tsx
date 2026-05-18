import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Hero } from "./Hero";
import { Form } from "./Form";
import { USP } from "./USP";
import { Process } from "./Process";
import { Review } from "./Review";
import { Contact } from "./Contact";
import { StickyButton } from "./StickyButton";
import { leadStoryDefaults } from "./_decorators";

function FullPage() {
  return (
    <main className="flex w-full flex-col bg-white pb-[82px] desktop:pb-0">
      <Hero />
      <Form />
      <USP />
      <Process />
      <Review />
      <Contact />
      <div className="desktop:hidden">
        <StickyButton />
      </div>
    </main>
  );
}

const meta: Meta<typeof FullPage> = {
  title: "Preview/Full Page",
  component: FullPage,
  ...leadStoryDefaults,
};

export default meta;
type Story = StoryObj<typeof FullPage>;

export const Desktop: Story = {
  parameters: { ...leadStoryDefaults.parameters, viewport: { defaultViewport: "desktop" } },
};

export const Tablet: Story = {
  parameters: { ...leadStoryDefaults.parameters, viewport: { defaultViewport: "tablet" } },
};

export const Mobile: Story = {
  parameters: { ...leadStoryDefaults.parameters, viewport: { defaultViewport: "mobile" } },
};
