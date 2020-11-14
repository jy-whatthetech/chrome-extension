const API_KEY = config.driveAPIKey; // read this from config file
const DRIVE_BASEURL = "https://www.googleapis.com/drive/v3/";

async function getAllFiles(fetchOptions, pageSize) {
  let get_files_url = `${DRIVE_BASEURL}files?key=${API_KEY}&corpora=user&includeItemsFromAllDrives=true&supportsAllDrives=true`;
  if (pageSize) {
    get_files_url += `&pageSize=${pageSize}`;
  }
  const response = await fetch(get_files_url, fetchOptions);
  const result = await response.json();
  return result;
}

async function getFileInfo(fetchOptions, fileId) {
  let get_file_url = `${DRIVE_BASEURL}files/${fileId}?key=${API_KEY}&supportsAllDrives=true`;
  const response = await fetch(get_file_url, fetchOptions);
  const result = await response.json();
  return result;
}

async function copyFile(authToken, fileId, name) {
  let copy_file_url = `${DRIVE_BASEURL}files/${fileId}/copy?key=${API_KEY}&supportsAllDrives=true&fields=*&alt=json`;
  const data = {
    name: name
  };
  const fetchOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  };
  const response = await fetch(copy_file_url, fetchOptions);
  const result = await response.json();
  return result;
}

// call 'copyFile()' for 'count' number of times. Generate name based on tokenized prefix and suffix
async function copyMultipleFiles(authToken, fileId, count, prefix, suffix) {
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {}
}

chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    const fetchOptions = msg.fetchOptions;
    const authToken = msg.authToken;

    // cleanup state variables
    performCleanup();

    // return the dom back to backgrounds.js
    sendResponse({ dom: document });

    let selectedIds = [];
    // filter out divs with data-tile-entry-id
    const divs = document.getElementsByTagName("div");
    for (let div of divs) {
      let fileId = "";
      if (div.hasAttribute("data-tile-entry-id")) {
        const tabindex = div.getAttribute("tabindex");
        if (tabindex === "0") {
          fileId = div.getAttribute("data-tile-entry-id");
        }
      } else if (div.hasAttribute("data-id")) {
        const childDivs = div.querySelectorAll("div");
        for (let childDiv of childDivs) {
          if (
            childDiv.hasAttribute("aria-selected") &&
            childDiv.getAttribute("aria-selected") === "true"
          ) {
            fileId = div.getAttribute("data-id");
            break;
          }
        }
      }
      if (fileId.length > 0) {
        selectedIds.push(fileId);
      }
    }

    console.log("ARRAY IS:");
    console.log(selectedIds); // Get the last one, sometimes previous pages' selections are also stored?

    const selectedFileId = selectedIds[selectedIds.length - 1];
    const fileInfo = await getFileInfo(fetchOptions, selectedFileId);
    console.log(fileInfo.name);

    let test123 = 1;
    if (test123 === 1) {
      return;
    }

    const copyResult = await copyFile(
      authToken,
      selectedFileId,
      "COPY_BRBRBRBRRBR"
    );
    console.log("COPY RESULT:");
    console.log(copyResult);

    const allFiles = await getAllFiles(fetchOptions, 50);
    console.log("FILES");
    console.log(allFiles);
  }

  sendResponse({
    msg: "Error: content.js received unexpected message from sender:",
    sender: sender
  });
});

// remove all stray divs from document, clear all the variables, read commentsToDisplay and ratingsToFilter from storage
function performCleanup() {
  // TODO:
}
