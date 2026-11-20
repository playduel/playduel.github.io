import { expect, test } from "@playwright/test";

/** Emotes reach the other screen, spam is held back, and quitting hands the win over. */
test("emotes reach the other screen; quitting forfeits and the other player is told", async ({ browser }) => {
  const ctx = await browser.newContext();
  const host = await ctx.newPage();
  const guest = await ctx.newPage();
  await host.goto("/?net=local&games=math#/");
  await host.getByTestId("name-input").fill("Alice");
  await host.getByTestId("create-match").click();
  const link = await host.getByTestId("invite-link").inputValue();
  await guest.goto(link);
  await guest.getByTestId("name-input").fill("Bob");
  await guest.getByTestId("join-match").click();
  await expect(host.getByTestId("lobby-status")).toHaveText("Bob joined!");
  await host.getByTestId("start-match").click();
  await expect(guest.getByTestId("intro")).toBeVisible();

  // Bob sends a skull: Alice sees it under Bob's name.
  await guest.getByRole("button", { name: "Emotes" }).dispatchEvent("pointerdown");
  await guest.getByTestId("emote-skull").dispatchEvent("pointerdown");
  await expect(host.getByTestId("bubble-guest")).toHaveText("💀");
  // Straight away the tray is cooling down: no second emote.
  await expect(guest.getByRole("button", { name: "Emotes cooling down" })).toBeVisible();

  // Alice quits (two steps) and lands on the menu; Bob is told he won.
  await host.getByTestId("quit").click();
  await host.getByTestId("quit-confirm").click();
  await expect(host.getByTestId("create-match")).toBeVisible();
  await expect(guest.getByTestId("forfeit-note")).toContainText("Alice quit");
});
