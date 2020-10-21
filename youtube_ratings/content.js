let strayDivIds = [];
const youtubeBaseUrl = "https://www.googleapis.com/youtube/v3/";

function convertHrefSetToStrings(hrefs) {
  const res = [];
  let ind = 0;
  const hrefList = [...hrefs];

  while (ind < hrefList.length) {
    let hrefString = "";
    for (let i = 0; i < 50; i++) {
      const actualInd = ind + i;
      const videoId = hrefList[actualInd];
      if (hrefString.length === 0) {
        hrefString = videoId;
      } else {
        hrefString += ",";
        hrefString += videoId;
      }
    }
    res.push(hrefString);
    ind += 50;
  }
  return res;
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    // perform cleanup
    for (let strayDivId of strayDivIds) {
      const strayDiv = document.getElementById(strayDivId);
      if (strayDiv) {
        strayDiv.remove();
      }
    }
    strayDivIds = [];

    const anchors = document.getElementsByTagName("a");
    const hrefs = new Set();
    const idToParentDiv = {};

    for (let anchor of anchors) {
      const link = anchor.href;
      if (link.indexOf("?v=") !== -1) {
        const start = link.indexOf("?v=") + 3;
        let end = link.length;
        if (link.indexOf("&t=") !== -1) {
          end = link.indexOf("&t=");
        }

        // TODO: create a regex that can filter out invalid filters. There may be other request parameters other than time
        // if (link.indexOf("&", start) !== -1) {
        //   end = link.indexOf("&", start);
        // }

        const videoId = link.slice(start, end);

        if (!hrefs.has(videoId)) {
          hrefs.add(videoId);

          // map videoId to closest parent div
          const parentDiv = anchor.closest("div");
          idToParentDiv[videoId] = parentDiv;
        }
      }
    }

    let youtubeAPIKey = config.youtubeAPIKey; // read this from config file
    const hrefStrings = convertHrefSetToStrings(hrefs);

    // get the top comments for this video
    // TODO: fetch this on tooltip hover
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      youtubeBaseUrl +
        `commentThreads?key=${youtubeAPIKey}&part=id,snippet&maxResults=100&textFormat=plainText&videoId=${hrefString}`,
      true
    );

    for (let hrefString of hrefStrings) {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        youtubeBaseUrl +
          `videos?key=${youtubeAPIKey}&part=snippet,contentDetails,statistics&id=${hrefString}`,
        true
      );
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          const response = JSON.parse(xhr.responseText);
          response.items.forEach(function(item) {
            // console.log(item.id);
            console.log("-------------------------------");
            if (item.snippet) {
              console.log(item.snippet.title);
            }
            if (item.statistics) {
              const likes = parseInt(item.statistics.likeCount);
              const dislikes = parseInt(item.statistics.dislikeCount);

              // comment count of -1 means comments disabled
              let commentCnt = parseInt(item.statistics.commentCount);
              if (isNaN(commentCnt)) {
                commentCnt = -1;
              }

              let likePercentage = 100;
              if (likes + dislikes > 0) {
                likePercentage = Math.round((likes / (likes + dislikes)) * 100);
              }

              // print out aggregated info
              console.log(
                `likes: ${likes} dislikes: ${dislikes}  Like Percentage: ${likePercentage}`
              );

              // decorate the divs with the ratings info
              const div = document.createElement("div");
              div.id = item.id;
              strayDivIds.push(div.id);

              div.style.position = "absolute";
              div.style.padding = "3px";
              div.style.background = "green";
              div.style.color = "white";

              if (likePercentage < 60) {
                div.style.background = "red";
              } else if (likePercentage < 90) {
                div.style.background = "yellow";
                div.style.color = "black";
              }

              div.textContent = `${likes} \\ ${likePercentage}% \\ ${
                commentCnt == -1 ? "Comments Disabled" : commentCnt
              }`;

              div.onmouseover = function() {
                div.title = "HELLO WORLD!!!";
              };

              const parentDiv = idToParentDiv[item.id];
              if (parentDiv) {
                parentDiv.appendChild(div);
              }
            }
          });
        } else {
          console.log(
            `The XMLHttpRequest readyState changed to ${xhr.readyState}`
          );
        }
      };
      xhr.send();
    }

    sendResponse({ dom: document });
  }

  sendResponse({ msg: "Error" });
});
