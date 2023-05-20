const puppeteer = require("puppeteer")
const fs = require('fs')
const path = require('path')

const URL = "https://listado.mercadolibre.com.uy/inmuebles/apartamentos/alquiler/hasta-2-dormitorios/montevideo/apartamento-alquiler-montevideo_OrderId_PRICE_FULL*BATHROOMS_*-1_NoIndex_True_PARKING*LOTS_0-0#applied_filter_id%3DBEDROOMS%26applied_filter_name%3DDormitorios%26applied_filter_order%3D7%26applied_value_id%3D*-2%26applied_value_name%3D*-2%26applied_value_order%3D6%26applied_value_results%3DUNKNOWN_RESULTS%26is_custom%3Dtrue"


function getActualDate() {
    const today = new Date()

    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${today.getFullYear()}-${month}-${day}`
}


function evaluatePage() {
    const data = []
    const div = document.getElementsByClassName("ui-search-layout")

    for (let child of div) {
        for (let li of child.childNodes) {
            const article = li.firstChild.firstChild
            const linkArticle = article.childNodes[0].firstChild.href

            const articleData = article.childNodes[1].childNodes[0]

            const priceData = articleData.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes[1]
            const moneda = priceData.firstChild.textContent
            const price = parseInt(priceData.childNodes[1].textContent.replace(".", ""))

            const metrosCuadrados = articleData.childNodes[1].firstChild.firstChild.textContent
            const title = articleData.childNodes[2].childNodes[1].textContent
            const dir = articleData.childNodes[3].textContent

            data.push({
                linkArticle,
                title,
                price,
                moneda,
                metrosCuadrados,
                dir
            })
        }
    }

    return data
}



function saveDataInJson(data) {
    let today = getActualDate().replaceAll("-", "")
    const filepath = path.join(__dirname, `/data/${today}.json`)

    fs.writeFile(filepath, data, "utf-8", (error) => {
        if (error)
            console.error("No se pudo guardar el archivo")
        else
            console.log("Archivo guardado en", filepath)
    })
}


async function start() {
    let browser;
    try {
        // in false, show the chromium window:
        browser = await puppeteer.launch({ headless: false })
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(0)
        await page.goto(URL)
        await page.waitForSelector("#cb1-edit")
        await page.click("#cb1-edit")

        console.log("Evaluando documento HTML...")
        const data = await page.evaluate(evaluatePage)

        await browser.close()
        return data

    } catch (error) {
        console.error(error)
        await browser.close()
    }
}


async function main() {
    const data = await start()
    // data.forEach(elem => console.log(elem))
    const jsonData = JSON.stringify(data)
    saveDataInJson(jsonData)
}


main()
