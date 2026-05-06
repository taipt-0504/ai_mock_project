import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateLocaleMock } = vi.hoisted(() => ({
  updateLocaleMock: vi.fn(),
}));
vi.mock("@/src/repositories/user-repository", () => ({
  userRepository: {
    updateLocale: updateLocaleMock,
  },
}));

import { localeService } from "@/src/services/locale-service";

describe("localeService.setLocale", () => {
  beforeEach(() => {
    updateLocaleMock.mockReset();
  });

  it("delegates to userRepository.updateLocale when a userId is provided", async () => {
    updateLocaleMock.mockResolvedValue(undefined);
    await localeService.setLocale("user-1", "en-US");
    expect(updateLocaleMock).toHaveBeenCalledTimes(1);
    expect(updateLocaleMock).toHaveBeenCalledWith("user-1", "en-US");
  });

  it("is a no-op for unauthenticated callers (userId === null)", async () => {
    await localeService.setLocale(null, "en-US");
    expect(updateLocaleMock).not.toHaveBeenCalled();
  });

  it("propagates repository errors so the route handler can map them", async () => {
    updateLocaleMock.mockRejectedValue(new Error("user not found"));
    await expect(localeService.setLocale("user-2", "en-US")).rejects.toThrow(
      "user not found",
    );
  });
});
