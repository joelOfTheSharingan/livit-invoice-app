import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(`<h1>Hello PDF Working ✅</h1>`);

    const pdf = await page.pdf({
      format: "A4",
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=test.pdf");

    res.end(pdf);

  } catch (err) {
    console.error(err);

    res.status(500).send(`
      <h1>ERROR</h1>
      <pre>${err.stack}</pre>
    `);
  }
}