const PREFIX_ID = "namePrefix";
const SUFFIX_ID = "nameSuffix";
const COPYCOUNT_ID = "copyCount";
const SHARE_LINKS_ID = "sharedLinks";
const COPY_BUTTON_ID = "copyButton";

document.addEventListener("DOMContentLoaded", documentEvents, false);

function documentEvents() {
  const copyCountElement = document.getElementById(COPYCOUNT_ID);
  const prefixElement = document.getElementById(PREFIX_ID);
  const suffixElement = document.getElementById(SUFFIX_ID);
  const sharedLinksElement = document.getElementById(SHARE_LINKS_ID);
  const copyButton = document.getElementById(COPY_BUTTON_ID);

  chrome.storage.local.get([PREFIX_ID, SUFFIX_ID, COPYCOUNT_ID], function(
    result
  ) {
    const copyCount = result[COPYCOUNT_ID];
    const prefix = result[PREFIX_ID];
    const suffix = result[SUFFIX_ID];

    if (copyCount) {
      copyCountElement.value = copyCount;
    }
    if (prefix) {
      prefixElement.value = prefix;
    }
    if (suffix) {
      suffixElement.value = suffix;
    }
  });

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

  copyButton.addEventListener("click", (event) =>{
    sharedLinksElement.style.display = "block";
    event.preventDefault();
  });
}
