/**
 * Scrapes REBNY Member Directory directly from https://api.rebny.com/search/people
 * Works in Google Apps Script (GAS) environment.
 */
function scrapeRebnyPeopleApi() {
  let sheet;
  try {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  } catch (e) {
    const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Replace if running standalone
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  }

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Scrape Date", "Member Name", "Company / Division", "Member Type", "Member ID", "Page"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const apiUrl = "https://api.rebny.com/search/people";
  
  // Set how many pages to fetch in this execution run (e.g. 10 pages = 200 members)
  const maxPagesToScrape = 10; 

  // Retrieve last scraped page from ScriptProperties to support seamless batching
  const scriptProperties = PropertiesService.getScriptProperties();
  let startPage = parseInt(scriptProperties.getProperty('LAST_SCRAPED_PAGE') || '1', 10);

  Logger.log(`Starting scraper from Page ${startPage}...`);

  for (let page = startPage; page < startPage + maxPagesToScrape; page++) {
    Logger.log(`Fetching Page ${page}...`);

    const payload = {
      page: page,
      limit: 20,
      pageSize: 20,
      query: "",
      search: ""
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.rebny.com",
        "Referer": "https://www.rebny.com/"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      const json = JSON.parse(response.getContentText());

      if (!json.body || !json.body.results || json.body.results.length === 0) {
        Logger.log("Reached end of directory or no further results returned.");
        scriptProperties.setProperty('LAST_SCRAPED_PAGE', '1'); // Reset to page 1
        break;
      }

      const results = json.body.results;
      const rowsToAppend = [];

      results.forEach(item => {
        const c = item.content || {};
        rowsToAppend.push([
          currentDate,
          c.title || "",
          c.Company || "",
          c.type || item.type || "",
          c.id || "",
          page
        ]);
      });

      if (rowsToAppend.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, 6).setValues(rowsToAppend);
        Logger.log(`Appended ${rowsToAppend.length} rows from Page ${page}.`);
      }

      // Save current page state
      scriptProperties.setProperty('LAST_SCRAPED_PAGE', (page + 1).toString());

    } else {
      Logger.log(`Page ${page} failed with Status Code: ${statusCode}`);
      break;
    }

    // 1-second delay between API requests to respect server rates
    Utilities.sleep(1000);
  }

  Logger.log(`Run complete. Next run will resume from Page ${scriptProperties.getProperty('LAST_SCRAPED_PAGE')}.`);
}

/**
 * Utility function to reset the page progress counter back to 1.
 */
function resetPageCounter() {
  PropertiesService.getScriptProperties().setProperty('LAST_SCRAPED_PAGE', '1');
  Logger.log("Scraper progress counter reset to Page 1.");
}