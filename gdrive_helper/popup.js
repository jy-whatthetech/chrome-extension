const PREFIX_ID = "namePrefix";
const SUFFIX_ID = "nameSuffix";
const COPYCOUNT_ID = "copyCount";
const SHARE_LINKS_ID = "sharedLinks";
const COPY_BUTTON_ID = "copyButton";
const SHARE_LINKS_TEXT = "sharedLinksText";

document.addEventListener("DOMContentLoaded", documentEvents, false);

function documentEvents() {
  const copyCountElement = document.getElementById(COPYCOUNT_ID);
  const prefixElement = document.getElementById(PREFIX_ID);
  const suffixElement = document.getElementById(SUFFIX_ID);
  const sharedLinksElement = document.getElementById(SHARE_LINKS_ID);
  const copyButton = document.getElementById(COPY_BUTTON_ID);
  const sharedLinksTextArea = document.getElementById(SHARE_LINKS_TEXT);

  chrome.storage.local.get(
    [PREFIX_ID, SUFFIX_ID, COPYCOUNT_ID, SHARE_LINKS_TEXT],
    function(result) {
      const copyCount = result[COPYCOUNT_ID];
      const prefix = result[PREFIX_ID];
      const suffix = result[SUFFIX_ID];
      const sharedLinksText = result[SHARE_LINKS_TEXT];

      if (copyCount) {
        copyCountElement.value = copyCount;
      }
      if (prefix) {
        prefixElement.value = prefix;
      }
      if (suffix) {
        suffixElement.value = suffix;
      }
      if (sharedLinksText) {
        sharedLinksTextArea.value = sharedLinksText;
      }
    }
  );

  copyCountElement.addEventListener("input", function() {
    chrome.storage.local.set(
      { [COPYCOUNT_ID]: copyCountElement.value },
      function() {}
    );
  });
  prefixElement.addEventListener("input", function() {
    chrome.storage.local.set(
      { [PREFIX_ID]: prefixElement.value },
      function() {}
    );
  });
  suffixElement.addEventListener("input", function() {
    chrome.storage.local.set(
      { [SUFFIX_ID]: suffixElement.value },
      function() {}
    );
  });

  copyButton.addEventListener("click", event => {
    // send message to the background script, so it can get the auth token and pass that to content.js
    chrome.runtime.sendMessage(
      {
        copyCount: copyCountElement.value,
        prefix: prefixElement.value,
        suffix: suffixElement.value
      },
      function(response) {
        // do nothing
      }
    );

    // TODO: show progress text

    // show text area with shared links
    sharedLinksElement.style.display = "block"; //TODO: update as copying is completing
    event.preventDefault();
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    console.log("change recived!");
    console.log(changes);
    if (changes[SHARE_LINKS_TEXT]) {
      const newValue = changes[SHARE_LINKS_TEXT].newValue;
      sharedLinksTextArea.value = newValue;
    }
  });
}
