import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock, fetchMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import LanguageSelector from "@/src/components/header/LanguageSelector";

describe("LanguageSelector — disclosure dropdown (T063)", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    document.cookie = "saa_locale=; path=/; max-age=0";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("displays the current locale chip and starts collapsed (aria-expanded=false)", () => {
    render(<LanguageSelector locale="vi-VN" />);
    const trigger = screen.getByRole("button", { name: /vn/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles the menu open on trigger click and exposes role=menu + role=menuitem entries", () => {
    render(<LanguageSelector locale="vi-VN" />);
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(2); // vi-VN + en-US
    expect(items[0]).toHaveTextContent("VN");
    expect(items[1]).toHaveTextContent("US");
  });

  it("ArrowDown / ArrowUp move the active item, Enter commits the selection", () => {
    render(<LanguageSelector locale="vi-VN" />);
    const trigger = screen.getByRole("button", { name: /vn/i });
    fireEvent.click(trigger);

    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "Enter" });

    // After commit the menu closes and the chip flips to the new selection.
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /us/i })).toBeInTheDocument();
  });

  it("Escape closes the menu without changing the selection", () => {
    render(<LanguageSelector locale="vi-VN" />);
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vn/i })).toBeInTheDocument();
  });

  it("click-outside closes the menu", () => {
    render(
      <div>
        <LanguageSelector locale="vi-VN" />
        <span data-testid="outside">elsewhere</span>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("commits the saa_locale cookie on selection (unauthenticated path)", () => {
    render(<LanguageSelector locale="vi-VN" />);
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /us/i }));

    expect(document.cookie).toContain("saa_locale=en-US");
    // Unauthenticated callers MUST NOT POST to the API (server returns 401).
    expect(fetchMock).not.toHaveBeenCalled();
    // router.refresh() flips the Server Component tree.
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("POSTs to /api/i18n/locale on selection when authenticated", async () => {
    render(<LanguageSelector locale="vi-VN" isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /us/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/i18n/locale");
    expect(init).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ locale: "en-US" });
  });

  it("reverts the optimistic locale when the API call fails", async () => {
    fetchMock.mockResolvedValue(new Response("internal", { status: 500 }));
    render(<LanguageSelector locale="vi-VN" isAuthenticated />);
    fireEvent.click(screen.getByRole("button", { name: /vn/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /us/i }));

    // Optimistic flip happens immediately.
    expect(screen.getByRole("button", { name: /us/i })).toBeInTheDocument();

    // After the API fails, the chip reverts.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /vn/i })).toBeInTheDocument();
    });
  });
});
