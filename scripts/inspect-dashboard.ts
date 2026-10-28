/**
 * One-off DOM inspection helper (not part of the app).
 *
 * Launches a visible browser and AUTO-DETECTS when you have logged in by
 * polling the page URL for a signed-in route (/dashboard or /learning). No
 * terminal interaction is required — just log in and wait. Once detected it
 * dumps candidate resume-card selectors to inspect-output.json and exits,
 * leaving the browser open.
 *
 * Run:  npx ts-node scripts/inspect-dashboard.ts
 */
import { chromium, Page } from "@playwright/test";
import * as fs from "fs";

const SIGNED_IN = /\/(dashboard|learning)\b/;

async function waitUntilSignedIn(page: Page, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const url = page.url();
    if (SIGNED_IN.test(url)) {
      // The "continue your learning journey" cards load lazily. Wait for an
      // actual lesson link to render (up to 30s) instead of a fixed delay.
      try {
        await page
          .locator('a[href*="/learning/"]')
          .first()
          .waitFor({ state: "visible", timeout: 30000 });
      } catch {
        // No learning link rendered; capture whatever is there anyway.
        await page.waitForTimeout(3000);
      }
      return true;
    }
    await page.waitForTimeout(1000);
  }
  return false;
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://app.manara.tech/", { waitUntil: "load", timeout: 30000 });

  process.stdout.write(
    "Browser open. Log in and navigate to your dashboard — I will detect it automatically (up to 5 minutes)...\n",
  );

  const ok = await waitUntilSignedIn(page, 5 * 60 * 1000);
  if (!ok) {
    process.stdout.write("Did not detect a signed-in page in time. Browser left open.\n");
    return;
  }

  process.stdout.write("Signed-in page detected (" + page.url() + "). Capturing...\n");

  const findings: Record<string, unknown> = {};
  findings.url = page.url();

  findings.learningLinks = await page
    .locator('a[href*="/learning/"]')
    .evaluateAll((els) =>
      els.slice(0, 15).map((e) => {
        const a = e as HTMLAnchorElement;
        return {
          href: a.getAttribute("href"),
          testid: a.getAttribute("data-testid"),
          text: (a.textContent || "").trim().slice(0, 80),
          classes: a.getAttribute("class"),
        };
      }),
    )
    .catch(() => []);

  findings.allAnchors = await page
    .locator("a")
    .evaluateAll((els) =>
      els
        .map((e) => (e as HTMLAnchorElement).getAttribute("href"))
        .filter((h): h is string => !!h && h.includes("/learning/"))
        .slice(0, 20),
    )
    .catch(() => []);

  findings.continueBlocks = await page
    .getByText(/continue your learning/i)
    .evaluateAll((els) =>
      els.slice(0, 8).map((e) => ({
        tag: e.tagName.toLowerCase(),
        testid: e.getAttribute("data-testid"),
        text: (e.textContent || "").trim().slice(0, 150),
      })),
    )
    .catch(() => []);

  // Buttons/cards that look clickable in a "continue learning" region.
  findings.clickableCards = await page
    .locator('[data-testid*="continue"], [data-testid*="card"], [class*="continue"], [class*="card"]')
    .evaluateAll((els) =>
      els.slice(0, 20).map((e) => ({
        tag: e.tagName.toLowerCase(),
        testid: e.getAttribute("data-testid"),
        role: e.getAttribute("role"),
        text: (e.textContent || "").trim().slice(0, 80),
      })),
    )
    .catch(() => []);

  findings.allTestIds = await page
    .locator("[data-testid]")
    .evaluateAll((els) =>
      Array.from(new Set(els.map((e) => e.getAttribute("data-testid")).filter(Boolean))).slice(0, 80),
    )
    .catch(() => []);

  fs.writeFileSync("inspect-output.json", JSON.stringify(findings, null, 2));
  process.stdout.write("Wrote inspect-output.json. Browser left open.\n");
}

main().catch((e) => {
  process.stderr.write("inspect failed: " + (e instanceof Error ? e.message : String(e)) + "\n");
});
