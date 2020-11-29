const PREFIX_ID = "namePrefix";
const SUFFIX_ID = "nameSuffix";
const COPYCOUNT_ID = "copyCount";
const SHARE_LINKS_ID = "sharedLinks";
const COPY_BUTTON_ID = "copyButton";

const SHARE_LINKS_TEXT = "sharedLinksText";

const NUMBER_TOKEN = "{x}";

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
  let copy_file_url = `${DRIVE_BASEURL}files/${fileId}/copy?key=${API_KEY}&fields=id,mimeType,name,webViewLink&supportsAllDrives=true&alt=json`;
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
async function copyMultipleFiles(
  authToken,
  fileId,
  count,
  name,
  prefix,
  suffix
) {
  if (count <= 0) return;
  const full_name_template = prefix + name + suffix;
  const tokenInd = full_name_template.indexOf(NUMBER_TOKEN);
  if (tokenInd === -1) {
    console.error("ERROR: NO TOKEN FOUND IN NAME");
    return;
  }

  const before = full_name_template.slice(0, tokenInd);
  const after = full_name_template.slice(
    tokenInd + 3,
    full_name_template.length
  );

  const multCopyResponse = [];

  for (let i = 1; i <= count; i++) {
    const curr_name = before + i + after;

    // call copy API
    const copyResponse = await copyFile(authToken, fileId, curr_name);
    console.log(curr_name + " COPIED");
    console.log(copyResponse);

    multCopyResponse.push(copyResponse);
  }

  return multCopyResponse;
}

chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    const fetchOptions = msg.fetchOptions;
    const authToken = msg.authToken;

    const copyCount = msg.copyCount;
    const prefix = msg.prefix;
    const suffix = msg.suffix;

    console.log("MESSAGE RECEIVED");
    console.log(msg);

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

    const multCopyResponse = await copyMultipleFiles(
      authToken,
      selectedFileId,
      copyCount,
      fileInfo.name,
      prefix,
      suffix
    );
    const shareLinks = getShareLinksText(multCopyResponse);
    console.log("Share Links");
    console.log(shareLinks);

    chrome.storage.local.set({ [SHARE_LINKS_TEXT]: shareLinks }, function() {});

    let test123 = 1;
    if (test123 === 1) {
      return;
    }
  }

  sendResponse({
    msg: "Error: content.js received unexpected message from sender:",
    sender: sender
  });
});

// remove all stray divs from document, clear all the variables, read commentsToDisplay and ratingsToFilter from storage
function performCleanup() {
  // chrome.storage.local.get(["commentsToDisplay", "ratingsToFilter"], function(
  //   result
  // ) {
  //   if (result.commentsToDisplay)
  //     commentsToDisplay = parseInt(result.commentsToDisplay);
  //   if (result.ratingsToFilter)
  //     ratingsToFilter = parseInt(result.ratingsToFilter);
  // });
}
chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log("change recived!");
  console.log(changes);
});

function getShareLinks(multCopyResponse) {
  const res = [];
  for (let copyResult of multCopyResponse) {
    res.push(copyResult.webViewLink);
  }
  return res;
}
function getShareLinksText(multCopyResponse) {
  const arr = getShareLinks(multCopyResponse);
  res = "";
  for (let s of arr) {
    res += s;
    res += "\n";
  }
  return res;
}
