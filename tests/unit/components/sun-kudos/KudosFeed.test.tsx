import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/sun-kudos/KudosFeedClient", () => ({
  default: ({
    initialItems,
    initialCursor,
  }: {
    initialItems: { id: string }[];
    initialCursor: string | null;
  }) => (
    <div
      data-testid="kudos-feed-client-stub"
      data-cursor={initialCursor ?? "null"}
    >
      {initialItems.map((k) => (
        <span key={k.id} data-id={k.id}>
          {k.id}
        </span>
      ))}
    </div>
  ),
}));

import KudosFeed from "@/src/components/sun-kudos/KudosFeed";
import type { Kudo } from "@/src/lib/kudos/types";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("KudosFeed — server-rendered initial page (T049)", () => {
  it("renders the empty-state message with role=status when initialItems is empty (FR-020)", () => {
    render(
      <KudosFeed initialItems={[]} initialCursor={null} locale="vi-VN" />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(viCatalog["kudos.feed.empty"]);
  });

  it("renders KudosFeedClient with the initial items + cursor when there is data", () => {
    const initialItems = [{ id: "k-1" }, { id: "k-2" }] as unknown as Kudo[];
    render(
      <KudosFeed
        initialItems={initialItems}
        initialCursor="2025-10-30T10:00:00.000Z|k-1"
        locale="vi-VN"
      />,
    );
    const client = screen.getByTestId("kudos-feed-client-stub");
    expect(client).toHaveAttribute("data-cursor", "2025-10-30T10:00:00.000Z|k-1");
    expect(client).toHaveTextContent("k-1");
    expect(client).toHaveTextContent("k-2");
  });
});
