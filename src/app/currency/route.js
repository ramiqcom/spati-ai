import googleCurrencyScraper, { CurrencyCode } from "google-currency-scraper";

export async function GET(){
	const currency = await googleCurrencyScraper({
			from: CurrencyCode.USD, // You can use "USD" as well
			to: CurrencyCode.IDR // You can use "TRY" as well
	});
	currency.dateUpdated = null;
	return new Response(currency.rate, {
		status: 200
	});
}