const API_KEY = config.driveAPIKey; // read this from config file

const DRIVE_BASEURL = "https://www.googleapis.com/drive/v3/";

const FILES_API_URL = `${DRIVE_BASEURL}files?key=${API_KEY}&corpora=user&includeItemsFromAllDrives=true&supportsAllDrives=true&pageSize=1000`;

function doStuffWithDom(resp) {
  if (resp.dom) {
    console.log("I received the following DOM content:\n" + resp.dom);
  } else {
    console.error(resp.msg);
    console.log(resp.sender);
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  //chrome.tabs.sendMessage(tab.id, { text: "report_back" }, doStuffWithDom);
});

chrome.commands.onCommand.addListener(function(command) {
  console.log("COMMAND EXECUTED");

  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    console.log("AUTH TOKEN OBTAINED");
    console.log(token);

    let fetch_options = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    fetch(FILES_API_URL, fetch_options)
      .then(res => res.json())
      .then(res => {
        console.log("RESULTS RETRIEVED:");
        console.log(res);
      });
  });

  // if (command === "toggle-feature") {
  //   chrome.tabs.query(
  //     {
  //       active: true,
  //       lastFocusedWindow: true
  //     },
  //     function(tabs) {
  //       var tab = tabs[0];
  //       chrome.tabs.sendMessage(
  //         tab.id,
  //         { text: "report_back" },
  //         doStuffWithDom
  //       );
  //     }
  //   );
  // }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {});
