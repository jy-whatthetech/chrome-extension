function doStuffWithDom(resp) {
  if (resp.dom) {
    console.log("I received the following DOM content:\n" + resp.dom);
  } else {
    console.error(resp.msg);
    console.log(resp.sender);
  }
}

// called when browser action is clicked. Possibly no effect when there is a popup.html?
chrome.browserAction.onClicked.addListener(function(tab) {
  //chrome.tabs.sendMessage(tab.id, { text: "report_back" }, doStuffWithDom);
});

// on command execute, send message to active tab (handler in content.js)
chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggle-feature") {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      function(tabs) {
        // get the auth token then pass token to active tab so content.js can handle it
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
          console.log("AUTH TOKEN OBTAINED");
          console.log(token);

          const fetchOptions = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };

          const tab = tabs[0];
          chrome.tabs.sendMessage(
            tab.id,
            {
              text: "report_back",
              fetchOptions: fetchOptions,
              authToken: token
            },
            doStuffWithDom
          );
        });
      }
    );
  }
});

// receive the message from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.copyCount) {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      function(tabs) {
        // get the auth token then pass token to active tab so content.js can handle it
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
          console.log("AUTH TOKEN OBTAINED");
          console.log(token);

          const fetchOptions = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };

          const tab = tabs[0];
          chrome.tabs.sendMessage(
            tab.id,
            {
              text: "report_back",
              fetchOptions: fetchOptions,
              ...msg
            },
            doStuffWithDom
          );
          sendResponse({
            msg: "Message passed on to content.js"
          });
        });
      }
    );
  } else {
    sendResponse({
      msg: "Error: background.js received unexpected message from sender:",
      sender: sender
    });
  }
});
