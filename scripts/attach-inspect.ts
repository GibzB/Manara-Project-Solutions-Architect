/**
 * Attach to the LIVE browser session (launched with --remote-debugging-port=9222)
 * and dump a SANITIZED structural snapshot of whatever page is currently open:
 *   - url, document.title, task header
 *   - accessible names of visible buttons/links (role-based, names only)
 *   - dialog / popup / banner / toast candidates with their text and testids
 *   - elements whose text contains target strings (Skip, Continue, Review)
 *
 * No cookies/tokens/credentials are read. No full HTML dump. No clicks.
 *
 * Run:  npx ts-node scripts/attach-inspect.ts
 * (the browser must have been started by `npm run study` / `npm run complete`)
 */
import { chromium, type Page } from "@playwright/test";

const CDP_URL = "http://localhost:9222";
const TARGET_TEXTS = ["skip", "continue", "review your knowledge", "completed the module", "congrat"];

async function dumpButtons(page: Page): Promise<void> {
  const buttons = await page
    .getByRole("button")
    .evaluateAll((els) =>
      els
        .filter((e) => {
          const r = (e as HTMLElement).getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((e) => ({
          name: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 80),
          testid: e.getAttribute("data-testid"),
          disabled: (e as HTMLButtonElement).disabled,
        }))
        .filter((b) => b.name.length > 0)
        .slice(0, 60),
    )
    .catch(() => [] as unknown[]);
  console.log("VISIBLE BUTTONS:", JSON.stringify(buttons, null, 2));
}

async function dumpOverlays(page: Page): Promise<void> {
  const overlays = await page
    .locator(
      [
        "[role='dialog']",
        "[role='alertdialog']",
        "[role='alert']",
        "[role='status']",
        "[data-testid*='modal']",
        "[data-testid*='dialog']",
        "[data-testid*='banner']",
        "[data-testid*='toast']",
        "[data-testid*='snackbar']",
        "[class*='modal']",
        "[class*='dialog']",
        "[class*='banner']",
        "[class*='toast']",
      ].join(", "),
    )
    .evaluateAll((els) =>
      els
        .filter((e) => {
          const r = (e as HTMLElement).getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((e) => ({
          role: e.getAttribute("role"),
          testid: e.getAttribute("data-testid"),
          tag: e.tagName.toLowerCase(),
          cls: (e.getAttribute("class") || "").slice(0, 80),
          text: (e.textContent || "").trim().slice(0, 200),
        }))
        .slice(0, 20),
    )
    .catch(() => [] as unknown[]);
  console.log("OVERLAYS/DIALOGS/BANNERS:", JSON.stringify(overlays, null, 2));
}

async function dumpTargetTexts(page: Page): Promise<void> {
  const body = (await page.locator("body").textContent().catch(() => "")) ?? "";
  for (const t of TARGET_TEXTS) {
    const idx = body.toLowerCase().indexOf(t);
    console.log(
      `TEXT "${t}": ${idx >= 0 ? `present ("...${body.slice(Math.max(0, idx - 40), idx + t.length + 60).trim().slice(0, 140)}...")` : "absent"}`,
    );
  }
}

async function main(): Promise<void> {
  const browser = await chromium.connectOverCDP(CDP_URL);
  const pages = browser
    .contexts()
    .flatMap((c) => c.pages())
    .filter((p) => p.url().includes("manara.tech"));

  if (pages.length === 0) {
    console.log("No Manara page found. Is the tool's browser open and logged in?");
    return;
  }

  for (const page of pages) {
    console.log("==================================================");
    console.log("PAGE:", page.url());
    console.log("TITLE:", await page.title().catch(() => "(n/a)"));
    const header = await page
      .locator("[data-testid='task-header']")
      .first()
      .textContent()
      .catch(() => null);
    console.log("TASK HEADER:", header ? header.trim() : "(none)");
    await dumpTargetTexts(page);
    await dumpButtons(page);
    await dumpOverlays(page);
  }
  console.log("==================================================");
  // Detach without closing the user's browser.
  browser.close();
}

main().catch((err) => {
  console.error("attach-inspect failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
