/**
 * Diagnostic function to inspect the exact structure of REBNY's API response.
 * Works in Google Apps Script (GAS) environment.
 */
function inspectRebnyApiResponse() {
  const apiUrl = "https://api.rebny.com/search/people";

  const payload = {
    page: 1,
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

  Logger.log("Sending POST request...");
  const response = UrlFetchApp.fetch(apiUrl, options);
  const text = response.getContentText();

  Logger.log("Full Raw Response Snippet (First 500 chars):");
  Logger.log(text.substring(0, 500));

  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      Logger.log(`Response is an Array containing ${json.length} items.`);
      if (json.length > 0) {
        Logger.log("First Item Keys: " + Object.keys(json[0]).join(", "));
      }
    } else {
      Logger.log("Response is an Object with Top-Level Keys: " + Object.keys(json).join(", "));
      
      // If there's a nested object/array, print its structure
      Object.keys(json).forEach(key => {
        const val = json[key];
        if (Array.isArray(val)) {
          Logger.log(` -> Key "${key}" contains an Array of ${val.length} items.`);
          if (val.length > 0 && typeof val[0] === 'object') {
            Logger.log(`    Sample item keys in "${key}": ` + Object.keys(val[0]).join(", "));
          }
        } else if (typeof val === 'object' && val !== null) {
          Logger.log(` -> Key "${key}" contains an Object with keys: ` + Object.keys(val).join(", "));
        }
      });
    }
  } catch (e) {
    Logger.log("Error parsing JSON response: " + e.toString());
  }
}