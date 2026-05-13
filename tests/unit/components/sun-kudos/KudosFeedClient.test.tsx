import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/sun-kudos/KudosCard", () => ({
  default: ({ kudo }: { kudo: { id: string; content: string } }) => (
    <article data-id={kudo.id}>{kudo.content}</article>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

import KudosFeedClient from "@/src/components/sun-kudos/KudosFeedClient";

const initial = [
  {
    id: "k-1",
    sender: { id: "s1", name: "S1", image: null, title: null, departmentId: null },
    receiver: { id: "r1", name: "R1", image: null, title: null, departmentId: null },
    content: "page-1-item",
    heartCount: 0,
    hashtags: [],
    images: [],
    createdAt: new Date(2025, 9, 30, 10, 0, 0),
  },
];

describe("KudosFeedClient — paginated feed island (T050)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders initial items immediately", () => {
    render(
      <KudosFeedClient
        initialItems={initial}
        initialCursor="2025-10-30T10:00:00.000Z|k-1"
        locale="vi-VN"
      />,
    );
    expect(screen.getByText("page-1-item")).toBeInTheDocument();
  });

  it("fetches the next page from /api/kudos when the sentinel intersects + appends results", async () => {
    const nextPage = {
      items: [
        {
          id: "k-2",
          sender: { id: "s2", name: "S2", image: null, title: null, departmentId: null },
          receiver: { id: "r2", name: "R2", image: null, title: null, departmentId: null },
          content: "page-2-item",
          heartCount: 0,
          hashtags: [],
          images: [],
          createdAt: new Date(2025, 9, 30, 9, 0, 0).toISOString(),
        },
      ],
      nextCursor: null,
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => nextPage,
    });

    render(
      <KudosFeedClient
        initialItems={initial}
        initialCursor="2025-10-30T10:00:00.000Z|k-1"
        locale="vi-VN"
      />,
    );

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toContain("/api/kudos");
    expect(url).toContain("cursor=2025-10-30T10%3A00%3A00.000Z%7Ck-1");

    await waitFor(() => {
      expect(screen.getByText("page-2-item")).toBeInTheDocument();
    });
  });

  it("does not fetch when initialCursor is null (hasMore=false from the start)", () => {
    render(
      <KudosFeedClient
        initialItems={initial}
        initialCursor={null}
        locale="vi-VN"
      />,
    );
    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
