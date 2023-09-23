import puppeteer from "puppeteer";
export async function GET(){
	const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

	const page = await browser.newPage();

	// set viewport and user agent (just in case for nice viewing)
	await page.setViewport({width: 1366, height: 768});
	await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

	// use Google to do currency exchange
  // currently data in Google provided by Morningstar for Currency and Coinbase for Cryptocurrency
  await page.goto(`https://www.currency.wiki/usd_idr?value=1`);

	// Query
	const info = 'body > main > div > div.my-6.text-center > div.convert-view-holder.my-8 > div > div.converted-currency.tk-futura-pt-bold.text-center.text-8xl > span.integer'

	// wait until the knowledge about currency is ready on DOM
	await page.waitForSelector(info);
	await new Promise(r => setTimeout(r, 1000));

	const result = await page.evaluate(() => {
		return document.querySelector('body > main > div > div.my-6.text-center > div.convert-view-holder.my-8 > div > div.converted-currency.tk-futura-pt-bold.text-center.text-8xl > span.integer').innerHTML
	});

  await browser.close();

	return new Response(result, {
		status: 200
	});
}