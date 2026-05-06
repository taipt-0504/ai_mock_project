import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "next-auth/react";

import LoginButton from "@/src/components/login/LoginButton";

const signInMock = vi.mocked(signIn);

const labels = {
  label: "LOGIN With Google",
  errorGeneric: "We couldn't sign you in. Please try again.",
  errorCookies:
    "Cookies are blocked. Please enable cookies for this site and try again.",
  errorCancelled: "Google sign-in was cancelled.",
};

describe("LoginButton (B.3)", () => {
  beforeEach(() => {
    signInMock.mockReset();
    // Restore the default jsdom navigator.onLine = true between tests.
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders in the idle state with the localized label", () => {
    render(<LoginButton labels={labels} />);
    const button = screen.getByRole("button", { name: labels.label });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("aria-busy", "false");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("invokes signIn('google') with callbackUrl='/' on click", async () => {
    signInMock.mockResolvedValue(undefined as never);
    render(<LoginButton labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.label }));
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("google", { callbackUrl: "/" });
    });
  });

  it("ignores duplicate clicks while a sign-in is in flight", async () => {
    let resolve: () => void = () => {};
    signInMock.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = () => r(undefined as never);
        }) as never,
    );
    render(<LoginButton labels={labels} />);
    const button = screen.getByRole("button", { name: labels.label });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
    expect(signInMock).toHaveBeenCalledTimes(1);
    resolve();
  });

  it("surfaces the generic error when navigator.onLine === false (Edge Case: no network)", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<LoginButton labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.label }));
    expect(signInMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(labels.errorGeneric);
  });

  it("surfaces the generic error when signIn() rejects", async () => {
    signInMock.mockRejectedValue(new Error("network failed"));
    render(<LoginButton labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.label }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(labels.errorGeneric);
    });
  });

  it("clears any displayed error and resets to idle on the pagehide event", async () => {
    signInMock.mockRejectedValue(new Error("boom"));
    render(<LoginButton labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.label }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    window.dispatchEvent(new Event("pagehide"));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
