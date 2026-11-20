import { expect, test } from "@playwright/test";

/**
 * A live game over the two-tab transport. With no one steering, both riders
 * ride straight into opposite walls on the same tick (the start is mirrored),
 * so both screens must call it a draw. Then the host steers, the guest
 * doesn't, and both screens must agree the host won.
 */
test("light cycles: both screens see the same result", async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext();
  const host = await ctx.newPage();
  const guest = await ctx.newPage();
  await host.goto("/?net=local&games=cycles#/");
  await host.getByTestId("name-input").fill("Alice");
  await host.getByTestId("create-match").click();
  const link = await host.getByTestId("invite-link").inputValue();
  await guest.goto(link);
  await guest.getByTestId("name-input").fill("Bob");
  await guest.getByTestId("join-match").click();
  await expect(host.getByTestId("lobby-status")).toHaveText("Bob joined!");
  await host.getByTestId("start-match").click();

  await expect(host.getByTestId("live-outcome")).toHaveText("Draw!", { timeout: 30_000 });
  await expect(guest.getByTestId("live-outcome")).toHaveText("Draw!", { timeout: 10_000 });
  await expect(guest.getByTestId("round-result")).toContainText("Tie", { timeout: 10_000 });

  // Replay with both players steering: whatever happens, the two screens must mirror each other.
  await host.getByTestId("live-game").waitFor({ timeout: 20_000 });
  await guest.getByTestId("live-game").waitFor({ timeout: 5_000 });
  await host.keyboard.press("w");
  await guest.keyboard.press("ArrowDown");
  const hostSaw = await host.getByTestId("live-outcome").innerText({ timeout: 30_000 });
  const mirror: Record<string, string> = { "You win!": "You lose", "You lose": "You win!", "Draw!": "Draw!" };
  await expect(guest.getByTestId("live-outcome")).toHaveText(mirror[hostSaw]!, { timeout: 10_000 });
});
