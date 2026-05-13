import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import KudoImageLightbox from "@/src/components/sun-kudos/KudoImageLightbox";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const sampleImages = [
  {
    id: "img-1",
    url: "https://picsum.photos/seed/lightbox-1/800/600",
    width: 800,
    height: 600,
    order: 0,
  },
  {
    id: "img-2",
    url: "https://picsum.photos/seed/lightbox-2/800/600",
    width: 800,
    height: 600,
    order: 1,
  },
];

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * Phase 5 T051 — KudoImageLightbox TDD red. The lightbox is the
 * gallery-thumbnail destination wired by T055. Modal behaviors that MUST
 * hold: Esc + backdrop close, content click does not bubble to backdrop,
 * close button focusable + activates via Enter/Space (button native), and
 * nothing renders when `open=false` so the modal stays out of the tab order.
 */
describe("KudoImageLightbox — modal overlay for Kudo gallery thumbnails", () => {
  it("renders nothing when open=false (no DOM, no tab order)", () => {
    const { container } = render(
      <KudoImageLightbox
        open={false}
        images={sampleImages}
        initialIndex={0}
        onClose={vi.fn()}
        locale="vi-VN"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the image at initialIndex with the canonical alt label", () => {
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={1}
        onClose={vi.fn()}
        locale="vi-VN"
      />,
    );
    const image = screen.getByAltText(viCatalog["kudos.lightbox.image_alt"]);
    expect(image).toHaveAttribute("src", sampleImages[1]!.url);
  });

  it("clicking the close button invokes onClose", () => {
    const onClose = vi.fn();
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={0}
        onClose={onClose}
        locale="vi-VN"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: viCatalog["kudos.lightbox.close"] }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking the backdrop invokes onClose", () => {
    const onClose = vi.fn();
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={0}
        onClose={onClose}
        locale="vi-VN"
      />,
    );
    fireEvent.click(screen.getByTestId("kudos-lightbox-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking the image content does not bubble to the backdrop / does not close", () => {
    const onClose = vi.fn();
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={0}
        onClose={onClose}
        locale="vi-VN"
      />,
    );
    fireEvent.click(screen.getByAltText(viCatalog["kudos.lightbox.image_alt"]));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape key invokes onClose (a11y dismiss + Constitution III)", () => {
    const onClose = vi.fn();
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={0}
        onClose={onClose}
        locale="vi-VN"
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses role=dialog with aria-modal=true to mark itself as a modal landmark", () => {
    render(
      <KudoImageLightbox
        open
        images={sampleImages}
        initialIndex={0}
        onClose={vi.fn()}
        locale="vi-VN"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
