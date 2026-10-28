/**
 * One-off live verification (not part of the app).
 *
 * Launches a visible browser, auto-detects sign-in by polling the URL (no
 * Enter needed), then runs the REAL LessonLocator with the REAL
 * defaultSelectors against the live dashboard and prints the outcome. This
 * proves the configured selectors resolve and that the resume path navigates
 * to a classroom lesson — navigation only.
 *
 * Run:  npx ts-node scripts/verify-live.ts
 */
import { chromium, Page } from "@playwright/test";
import { LessonLocator } from "../src/locator";
import { defaultSelectors } from "../src/selectors";
import { Reporter } from "../src/terminal";

function isSignedInUrl(raw: string): boolean {
  let pathname = raw;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    /* keep raw */
  }
  if (/\/auth\/signin\b/.test(pathname)) return false;
  return /\/(dashboard|learning)\b/.test(pathname);
}

async function waitSignedIn(page: Page, ms: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (isSignedInUrl(page.url())) {
      try {
        await page
          .locator("a[href*='/learning/'][href*='/classroom']")
          .first()
          .waitFor({ state: "visible", timeout: 30000 });
      } catch {
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
  await page.goto(defaultSelectors.platformUrl, { waitUntil: "load", timeout: 30000 });
  process.stdout.write("Log in and reach the dashboard — auto-detecting...\n");

  const ok = await waitSignedIn(page, 5 * 60 * 1000);
  if (!ok) {
    process.stdout.write("No signed-in page detected in time.\n");
    return;
  }

  const urlBefore = page.url();
  const outcome = await new LessonLocator(new Reporter()).locateNextIncomplete(
    page,
    defaultSelectors,
  );
  const urlAfter = page.url();

  process.stdout.write("OUTCOME: " + JSON.stringify(outcome) + "\n");
  process.stdout.write("URL before: " + urlBefore + "\n");
  process.stdout.write("URL after:  " + urlAfter + "\n");
  process.stdout.write(
    "Navigated into a classroom lesson: " + /\/classroom/.test(urlAfter) + "\n",
  );
}

main().catch((e) => {
  process.stderr.write("verify failed: " + (e instanceof Error ? e.message : String(e)) + "\n");
});
