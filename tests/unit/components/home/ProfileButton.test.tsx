import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/actions/auth", () => ({
  signOutAction: vi.fn(async () => undefined),
}));

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

  it("the Sign out menu item is a submit button inside a form bound to the signOut Server Action", () => {
    const { container } = render(
      <ProfileButton locale="vi-VN" name="Alice" image={null} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    const submitButton = screen.getByRole("menuitem", { name: SIGN_OUT_LABEL });
    expect(submitButton).toHaveAttribute("type", "submit");
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    // React serializes Server Action references on the form element; the
    // exact attribute name is internal, but the form must NOT keep the
    // legacy raw URL action that triggered the MissingCSRF redirect bug.
    expect(form).not.toHaveAttribute("action", "/api/auth/signout");
    expect(container.querySelector("form[action='/api/auth/signout']")).toBeNull();
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

  it("pressing Escape while menu is open closes it and returns focus to trigger", async () => {
    const user = userEvent.setup();
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    const trigger = screen.getByRole("button", { name: "Alice" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("pressing Escape while menu is closed is a no-op (no error, menu stays absent)", async () => {
    const user = userEvent.setup();
    render(<ProfileButton locale="vi-VN" name="Alice" image={null} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
