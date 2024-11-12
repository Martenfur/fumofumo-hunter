//const http = require('http')
const puppeteer = require('puppeteer');

// Searches first 50 items matching the keyword.
async function search(search)
{
	search = search.replace(" ", "%20")
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	await page.setUserAgent("python-amiami_dev");

	await page.setExtraHTTPHeaders({
		"X-User-Key": "amiami_dev"
	});
	
	await page.goto(
		'https://api.amiami.com/api/v1.0/items?pagemax=50&lang=eng&mcode=&ransu=&age_confirm=&s_keywords=' + search,
		{ waitUntil: 'networkidle2' }
	);

	const jsonData = await page.evaluate(() => {
		const container = document.querySelector('body > pre');
		
		if (container) {
			try {
				return JSON.parse(container.innerText)
			} catch (e) {
				console.error('Failed to parse JSON:', e)
				return null;
			}
		} else {
			console.error('Container not found')
			return null
		}
	})

	await browser.close()
	console.log("raw data: " + jsonData)

	return jsonData.items
}

//run(null, null, null)

exports.search = search