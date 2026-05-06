import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Footer from "@/src/components/footer/Footer";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";

describe("Footer (mms_D_Footer)", () => {
  it("renders the localized copyright string for vi-VN", () => {
    render(<Footer locale="vi-VN" />);
    expect(screen.getByText(viCatalog["footer.copyright"])).toBeInTheDocument();
  });

  it("renders the localized copyright string for en-US", () => {
    render(<Footer locale="en-US" />);
    expect(screen.getByText(enCatalog["footer.copyright"])).toBeInTheDocument();
  });

  it("uses a <footer> landmark element (contentinfo role)", () => {
    render(<Footer locale="vi-VN" />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("anchors to the bottom of the viewport (sticky-bottom equivalent — FR-013)", () => {
    const { container } = render(<Footer locale="vi-VN" />);
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer!.className).toMatch(/(?:absolute|fixed|sticky)/);
    expect(footer!.className).toMatch(/bottom-0/);
  });

  it("contains no interactive elements (FR-012 — non-interactive)", () => {
    render(<Footer locale="vi-VN" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
