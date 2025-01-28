"use client";

import DataOverview from "@/components/data-overview";
import ButtonTheme from "@/components/ui/shuip/button.theme";

export default function Home() {
  return (
    <main className="container mx-auto">
      <ButtonTheme />
      <h1>Welcome to Next.js!</h1>
      <DataOverview />
    </main>
  );
}
