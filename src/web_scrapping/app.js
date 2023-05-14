const puppeteer = require("puppeteer")

const URL = "https://listado.mercadolibre.com.uy"

const start = async () => {
    let browser;
    try {
        // in false, show the chromium window:
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.goto(`${URL}/product`);
        await page.waitForTimeout(4000);
        await page.waitForSelector("[ui-search-layout]");
        console.log("Evaluando documento HTML...");

        const data = await page.evaluate(() => {
            const olElement = document.querySelector(".ui-search-layout");
            const infoScrapping = [];

            // the ideal would be to obtain the current price from an API:
            const convertDollarToPesosUy = price => price * 42.71;

            const isAValidResult = titleArticle => {
                // return true if the result is really a ps5
                let title = titleArticle.toUpperCase().replaceAll(" ", "");
                const words = ["PS5", "PLAYSTATION5"]
                return title.search(words[0]) !== -1 || title.search(words[1]) !== -1;
            }

            for (const child of olElement.childNodes) {
                // const divContainer = document.querySelector(".ui-search-result__wrapper");
                const divContainer = child.childNodes[0];
                const contentWrapper = divContainer.childNodes[0].childNodes[1];
                const titleElement = contentWrapper.childNodes[0].childNodes[0];   // element: <a href=""></a>
                const link = titleElement.href;
                const title = titleElement.childNodes[0].textContent;
                if (isAValidResult(title)) {
                    continue;
                }

                const soldByElement = contentWrapper.childNodes[0].childNodes[1].childNodes[0].textContent;
                if (soldByElement === null || soldByElement === undefined) {
                    soldByElement = "Sin información del vendedor";
                }
                const priceElement = contentWrapper.childNodes[1].childNodes[0]
                    .childNodes[0].childNodes[0].childNodes[0].childNodes[0];

                const coin = priceElement.childNodes[0].textContent;    // U$S or $
                let price = parseFloat((priceElement.childNodes[1].textContent).replace(".", ""));

                if (coin === "U$S") {
                    price = convertDollarToPesosUy(price);
                }
                infoScrapping.push({
                    title: title,
                    soldBy: soldByElement,
                    price: price,
                    link: link
                });

            }
            return infoScrapping;
        });

        await browser.close();
        data.forEach(elem => console.log(elem));
        return data;

    } catch (exception) {
        console.log(exception);
        await browser.close();
    }
}


const main = async () => {
    const data = await start()
    data.forEach(element => console.log(element))
    /**
     * Guardar la info en archivo .json
     */
}


main()
