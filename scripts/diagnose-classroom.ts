/**
 * One-off classroom DIAGNOSTIC (not part of the app).
 *
 * Auto-detects sign-in, navigates to a classroom lesson, waits for content,
 * and captures a SANITIZED structural snapshot to classroom-diag.json:
 *   - url, document.title
 *   - visible heading texts (h1-h4) and their testids
 *   - accessible button names (role=button) — names only, not full DOM
 *   - whether lesson content sits inside an iframe (and the frame count)
 *   - presence of "Mark as Completed" / "Marked as Completed" strings
 *   - a shortlist of data-testid values
 *
 * It does NOT log cookies/tokens/credentials and does NOT dump full page HTML.
 * It never clicks completion or Next controls.
 *
 * Run:  npx ts-node scripts/diagnose-classroom.ts
 */
import { chromium, Page, Frame } from "@playwright/test";
import * as fs from "fs";

const LESSON_URL =
  "https://app.manara.tech/learning/7/102/classroom?cardLocation=dashboard%20page%20-%20continue%20your%20learning%20journey%20section&location=Card%20Click";

function isSignedIn(raw: string): boolean {
  let pathname = raw;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    /* keep raw */
  }
  if (/\/auth\/signin\b/.test(pathname)) return false;
  return /\/(dashboard|learning)\b/.test(pathname);
}

async function headingsIn(scope: Page | Frame): Promise<unknown[]> {
  return scope
    .locator("h1, h2, h3, h4, [role='heading']")
    .evaluateAll((els) =>
      els.slice(0, 25).map((e) => ({
        tag: e.tagName.toLowerCase(),
        level: e.getAttribute("aria-level"),
        testid: e.getAttribute("data-testid"),
        text: (e.textContent || "").trim().slice(0, 100),
      })),
    )
    .catch(() => []);
}

async function buttonsIn(scope: Page | Frame): Promise<unknown[]> {
  return scope
    .getByRole("button")
    .evaluateAll((els) =>
      Array.from(
        new Set(
          els
            .map((e) => (e.getAttribute("aria-label") || e.textContent || "").trim())
            .filter((t) => t.length > 0 && t.length < 60),
        ),
      ).slice(0, 40),
    )
    .catch(() => []);
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://app.manara.tech/", { waitUntil: "load", timeout: 30000 });
  process.stdout.write("Log in — auto-detecting sign-in (up to 5 min)...\n");

  const start = Date.now();
  while (Date.now() - start < 5 * 60 * 1000) {
    if (isSignedIn(page.url())) break;
    await page.waitForTimeout(1000);
  }
  if (!isSignedIn(page.url())) {
    process.stdout.write("No sign-in detected in time.\n");
    return;
  }

  // Navigate to the specific lesson and wait for network + a heading to settle.
  await page.goto(LESSON_URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page
    .locator("h1, h2, h3, h4, [role='heading']")
    .first()
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => {});

  const diag: Record<string, unknown> = {};
  diag.url = page.url();
  diag.documentTitle = await page.title().catch(() => null);

  // Main-document structure.
  diag.mainHeadings = await headingsIn(page);
  diag.mainButtons = await buttonsIn(page);

  // Iframe / nested browsing context detection.
  const frames = page.frames();
  diag.frameCount = frames.length;
  diag.frameUrls = frames
    .map((f) => {
      try {
        return new URL(f.url()).pathname;
      } catch {
        return f.url().slice(0, 60);
      }
    })
    .slice(0, 10);

  // Headings/buttons inside non-main frames (lesson content is often framed).
  const framed: Record<string, unknown>[] = [];
  for (const f of frames) {
    if (f === page.mainFrame()) continue;
    framed.push({
      urlPath: (() => {
        try {
          return new URL(f.url()).pathname;
        } catch {
          return "(opaque)";
        }
      })(),
      headings: await headingsIn(f),
      buttons: await buttonsIn(f),
    });
  }
  diag.framedContent = framed.slice(0, 5);

  // Presence of completion-related strings in the main document body (text
  // only, bounded) — never the full HTML.
  const bodyText = (await page.locator("body").textContent().catch(() => "")) || "";
  diag.hasMarkAsCompleted = bodyText.includes("Mark as Completed");
  diag.hasMarkedAsCompleted = bodyText.includes("Marked as Completed");
  diag.bodyTextLength = bodyText.length;

  diag.testIds = await page
    .locator("[data-testid]")
    .evaluateAll((els) =>
      Array.from(new Set(els.map((e) => e.getAttribute("data-testid")).filter(Boolean))).slice(0, 80),
    )
    .catch(() => []);

  fs.writeFileSync("classroom-diag.json", JSON.stringify(diag, null, 2));
  process.stdout.write("Wrote classroom-diag.json. Browser left open.\n");
}

main().catch((e) => {
  process.stderr.write("diag failed: " + (e instanceof Error ? e.message : String(e)) + "\n");
});
