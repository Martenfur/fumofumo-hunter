//const http = require('http')
const puppeteer = require('puppeteer');

// Searches first 50 items matching the keyword.
async function search(search)
{
	try
	{
		var browserConfig = { 
			headless: true, 
			executablePath: '/usr/bin/chromium-browser'
		}
		if (process.platform === "win32")
		{
			// Linux requires manually pointing to Chromium to work.
			browserConfig = { 
				headless: true
			}
		}
		search = search.replace(" ", "%20")
		const browser = await puppeteer.launch(browserConfig);
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
			const container = document.querySelector('body > pre')

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
	catch(e)
	{
		console.log("ERROR trying to get data from Amiami! probably blocked. :(")
		console.log(e)

		return null
	}
}

exports.search = search