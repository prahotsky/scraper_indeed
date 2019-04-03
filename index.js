const puppeteer = require("puppeteer")
const fs = require("fs")
const searchString = "devops"

const getJobs = async () => {
  try {
    console.log("Opening Google Chrome...")
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await Promise.all([
      page.goto(`https://www.indeed.com/jobs?q=${searchString}&sort=date`),
      page.waitForNavigation({ waitUntil: "networkidle0" })
    ])
    let pageNum = 1
    const jobsArr = []
    while (true) {
      try {
        console.log("Page number: ", pageNum)
        const cardsNum = await page.evaluate(
          () => document.querySelectorAll(".jobsearch-SerpJobCard").length
        )
        for (let i = 0; i < cardsNum; i++) {
          const jobsObj = await page.evaluate(i => {
            const jobsObj = {}
            jobsObj.title = document.querySelectorAll(".jobtitle")[i].innerText
            jobsObj.company = document.querySelectorAll(".company")[i].innerText
            jobsObj.summary = document.querySelectorAll(".summary")[i].innerText
            jobsObj.date = document.querySelectorAll(".date")[i].innerText
            jobsObj.link = document.querySelectorAll(
              ".jobsearch-SerpJobCard > h2 > a"
            )[i].href
            return jobsObj
          }, i)
          await jobsArr.push(jobsObj)
        }
        await page.waitForSelector("#resultsCol > div.pagination > b + a", {
          timeout: 5000
        })
        await Promise.all([
          page.goto(
            `https://www.indeed.com/jobs?q=${searchString}&sort=date&start=${pageNum *
              10}`
          ),
          page.waitForNavigation({ waitUntil: "networkidle0" })
        ])
        pageNum++
      } catch (err) {
        // console.log(`${err}`)
        break
      }
    }
    await browser.close()
    return jobsArr
  } catch (err) {
    console.log(err)
  }
}

const writeToFile = () => {
  getJobs().then(data => {
    console.log("Number of jobs: " + data.length)
    console.log("Writing to file...")
    fs.writeFileSync(
      `./data/${searchString}.json`,
      JSON.stringify(data, null, "\t"),
      "utf-8"
    )
    console.log("Completed")
  })
}

writeToFile()
