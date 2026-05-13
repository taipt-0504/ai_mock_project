import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/sun-kudos/KudoHashtagChips", () => ({
  default: ({ hashtags }: { hashtags: { id: string; name: string }[] }) => (
    <div data-testid="hashtag-chips-stub">
      {hashtags.map((h) => (
        <span key={h.id} data-hashtag-id={h.id}>
          #{h.name}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("@/src/components/sun-kudos/KudoImageGallery", () => ({
  default: ({ images }: { images: { id: string }[] }) => (
    <div data-testid="image-gallery-stub" data-thumbs={images.length}>
      gallery
    </div>
  ),
}));

vi.mock("@/src/components/sun-kudos/KudosAvatarLink", () => ({
  default: ({
    author,
    children,
  }: {
    author: { id: string };
    children: React.ReactNode;
  }) => (
    <span data-testid="avatar-link-stub" data-author-id={author.id}>
      {children}
    </span>
  ),
}));

import KudosCard from "@/src/components/sun-kudos/KudosCard";
import type { Kudo, KudoAuthor, Hashtag } from "@/src/lib/kudos/types";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const sender: KudoAuthor = {
  id: "sender-1",
  name: "Phương Anh",
  image: null,
  title: "Senior Engineer",
  departmentId: "engineering",
};
const receiver: KudoAuthor = {
  id: "receiver-1",
  name: "Đức Anh",
  image: null,
  title: "Designer",
  departmentId: "design",
};
const baseHashtag = (i: number): Hashtag => ({
  id: `ht-${i}`,
  name: `Tag${i}`,
  slug: `tag-${i}`,
});

function makeKudo(overrides: Partial<Kudo> = {}): Kudo {
  return {
    id: "kudo-1",
    sender,
    receiver,
    content: "Cảm ơn em rất nhiều!",
    heartCount: 0,
    hashtags: [baseHashtag(1)],
    images: [],
    createdAt: new Date(2025, 9, 30, 10, 0, 0),
    ...overrides,
  };
}

describe("KudosCard — feed card (Phase 5 T043 / T044)", () => {
  it("renders sender + receiver names via KudosAvatarLink instances", () => {
    render(<KudosCard kudo={makeKudo()} locale="vi-VN" />);
    const avatarStubs = screen.getAllByTestId("avatar-link-stub");
    expect(avatarStubs).toHaveLength(2);
    expect(avatarStubs[0]).toHaveTextContent("Phương Anh");
    expect(avatarStubs[1]).toHaveTextContent("Đức Anh");
  });

  it("renders the timestamp in the Figma C.3.4 format `HH:mm - MM/DD/YYYY`", () => {
    render(
      <KudosCard
        kudo={makeKudo({ createdAt: new Date(2025, 9, 30, 14, 5, 0) })}
        locale="vi-VN"
      />,
    );
    expect(screen.getByText("14:05 - 10/30/2025")).toBeInTheDocument();
  });

  it("renders the content text inside an element with the 5-line clamp class", () => {
    render(
      <KudosCard
        kudo={makeKudo({ content: "Một đoạn cảm ơn rất dài cho phép kiểm tra clamp." })}
        locale="vi-VN"
      />,
    );
    const content = screen.getByText(/Một đoạn cảm ơn rất dài/);
    expect(content.className).toMatch(/line-clamp-5/);
  });

  it("forwards the first 5 hashtags to KudoHashtagChips and appends an overflow indicator when there are more than 5", () => {
    const sixHashtags = Array.from({ length: 6 }, (_, i) => baseHashtag(i + 1));
    render(
      <KudosCard kudo={makeKudo({ hashtags: sixHashtags })} locale="vi-VN" />,
    );
    const chips = screen.getByTestId("hashtag-chips-stub");
    const tags = within(chips).getAllByText(/^#Tag\d$/);
    expect(tags).toHaveLength(5);
    expect(
      screen.getByText(
        viCatalog["kudos.card.hashtag_overflow"].replace("{count}", "1"),
      ),
    ).toBeInTheDocument();
  });

  it("renders all images via KudoImageGallery (gallery handles its own 5-thumb cap)", () => {
    const images = Array.from({ length: 7 }, (_, i) => ({
      id: `img-${i}`,
      url: `https://picsum.photos/seed/k${i}/100/100`,
      width: 100,
      height: 100,
      order: i,
    }));
    render(
      <KudosCard kudo={makeKudo({ images })} locale="vi-VN" />,
    );
    expect(screen.getByTestId("image-gallery-stub")).toHaveAttribute(
      "data-thumbs",
      "7",
    );
  });

  it("renders the `Xem chi tiết` link pointing to /sun-kudos/{kudoId}", () => {
    render(<KudosCard kudo={makeKudo({ id: "kudo-xyz" })} locale="vi-VN" />);
    const detailLink = screen.getByRole("link", {
      name: viCatalog["kudos.card.detail_link"],
    });
    expect(detailLink).toHaveAttribute("href", "/sun-kudos/kudo-xyz");
  });

  it("does NOT render the C.4 action bar (heart + copy link) in Phase 5 — those ship with Phase 6", () => {
    render(<KudosCard kudo={makeKudo()} locale="vi-VN" />);
    expect(
      screen.queryByRole("button", { name: /heart/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /copy link/i }),
    ).not.toBeInTheDocument();
  });

  it("uses an <article> landmark with the kudo id surfaced as the DOM id (deep-link target for /sun-kudos#kudo-xyz)", () => {
    render(<KudosCard kudo={makeKudo({ id: "kudo-xyz" })} locale="vi-VN" />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("id", "kudo-xyz");
  });
});
