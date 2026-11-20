import { expect, test } from "@playwright/test";

/** Every game opens, runs for a few seconds and throws no errors. */
const SOLO = ["clock", "countflash", "colorclash", "typing", "pairs", "slide", "stacker", "maze", "mines", "five", "snake", "wordgrid"];
const LIVE = ["cycles", "snakeduel", "tug", "connect4", "dots", "pong"];

for (const id of SOLO) {
  test(`solo game ${id} runs`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/#/practice/${id}`);
    await page.getByRole("button", { name: "Play" }).click();
    await expect(page.locator(".game-player")).toBeVisible();
    await page.mouse.click(200, 500);
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(2500);
    expect(errors).toEqual([]);
  });
}

for (const id of LIVE) {
  test(`live game ${id} runs on a shared screen`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/?games=${id}#/local`);
    await page.getByTestId("local-start").click();
    await expect(page.getByTestId("live-game")).toBeVisible({ timeout: 15_000 });
    for (const k of ["w", "ArrowDown", "a", "l", "1", "Space"]) await page.keyboard.press(k);
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });
}
