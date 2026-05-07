import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProfileButton from "@/src/components/home/ProfileButton";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const PROFILE_LABEL = viCatalog["home.profile.profile"];
const SIGN_OUT_LABEL = viCatalog["home.profile.sign_out"];

describe("ProfileButton (US2 / FR-005 — user variant per PQ1 = b)", () => {
  it("renders an avatar button with the user name as aria-label and starts collapsed (aria-expanded=false)", () => {
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    const trigger = screen.getByRole("button", { name: "Alice" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("falls back to the initial of the name when no avatar image is provided", () => {
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("falls back to '?' when neither name nor image are provided", () => {
    render(<ProfileButton locale="vi-VN" name={null} image={null} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("clicking the avatar toggles the menu open and renders Profile + Sign out items", () => {
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    const items = screen.getAllByRole("menuitem");
    expect(items.map((i) => i.textContent?.trim())).toEqual([
      PROFILE_LABEL,
      SIGN_OUT_LABEL,
    ]);
  });

  it("the Profile menu item is a Link to /profile", () => {
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    const profileItem = screen.getByRole("menuitem", { name: PROFILE_LABEL });
    expect(profileItem).toHaveAttribute("href", "/profile");
  });

  it("the Sign out menu item submits a POST form to /api/auth/signout", () => {
    const { container } = render(
      <ProfileButton locale="vi-VN" name="Alice" image={null} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    const form = container.querySelector("form[action='/api/auth/signout']");
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("method", "post");
    const submitButton = form!.querySelector("button[type='submit']");
    expect(submitButton).toHaveTextContent(SIGN_OUT_LABEL);
  });

  it("clicking outside the avatar/menu closes the menu (mousedown listener)", () => {
    render(
      <div>
        <ProfileButton locale="vi-VN" name="Alice" image={null} />
        <span data-testid="outside">elsewhere</span>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
