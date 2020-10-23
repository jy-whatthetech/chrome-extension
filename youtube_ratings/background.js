function doStuffWithDom(resp) {
  if (resp.dom) {
    console.log("I received the following DOM content:\n" + resp.dom);
  } else {
    console.error(resp.msg);
    console.log(resp.sender);
  }
}

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, { text: "report_back" }, doStuffWithDom);
});
