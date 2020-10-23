const youtubeBaseUrl = "https://www.googleapis.com/youtube/v3/";
const youtubeAPIKey = config.youtubeAPIKey; // read this from config file
let videoIdToDivs = {}; // map of video ids to the divs that link to this video
let strayDivIds = [];
let videoInformation = {}; // map of video id to info object

function performCleanup() {
  for (let divId of strayDivIds) {
    const strayDiv = document.getElementById(divId);
    if (strayDiv) {
      strayDiv.remove();
    }
  }
  strayDivIds = [];
  videoIdToDivs = {};
  videoInformation = {};
}

// given a list of videoIds, return a list of compacted (comma-separated) strings
function getPaginatedVideoIds(videoIds) {
  const res = [];
  let ind = 0;

  // process 50 links at once
  while (ind < videoIds.length) {
    let hrefString = "";
    for (let i = 0; i < 50; i++) {
      const actualInd = ind + i;
      const videoId = videoIds[actualInd];

      // append to string
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

// takes href string and returns videoId
function stripLink(link) {
  if (link.indexOf("?v=") === -1) return null;
  let end = link.length;
  if (link.indexOf("&t=") !== -1) {
    end = link.indexOf("&t=");
  }
  return link.slice(link.indexOf("?v=") + 3, end);
}

// makes the API call and does the processing of server call response
async function processVideosList(videoIdsString) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      youtubeBaseUrl +
        `videos?key=${youtubeAPIKey}&part=snippet,statistics&id=${videoIdsString}`,
      true
    );
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        const response = JSON.parse(xhr.responseText);
        if (!response.items) {
          console.error(`Error: the response does not have 'items' property`);
          console.log(response);
        }

        // loop through items and parse the information
        response.items.forEach(function(item) {
          const likes = parseInt(item.statistics.likeCount);
          const dislikes = parseInt(item.statistics.dislikeCount);
          const likePercentage =
            likes + dislikes > 0
              ? Math.round((likes / (likes + dislikes)) * 100)
              : 100;

          // comment count of -1 means comments disabled
          let commentCnt = parseInt(item.statistics.commentCount);
          if (isNaN(commentCnt)) {
            commentCnt = -1;
          }

          videoInformation[item.id] = {
            likes: likes,
            dislikes: dislikes,
            likePercentage: likePercentage,
            commentCount: commentCnt
          };

          // print out aggregated info
          console.log("-------------------------------");
          console.log(item.snippet.title);
          console.log(
            `likes: ${likes} dislikes: ${dislikes}  Like Percentage: ${likePercentage}`
          );

          resolve(videoInformation);
        });
      } else {
        console.log(
          `The XMLHttpRequest readyState changed to ${xhr.readyState}`
        );
      }
    };
    xhr.send();
  });
}

chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    performCleanup();

    const anchors = document.getElementsByTagName("a");

    // for each anchor element, strip the videoId and map it to its parent divs
    for (let anchor of anchors) {
      const videoId = stripLink(anchor.href);
      if (!videoId) continue;

      const parentDiv = anchor.closest("div");
      if (parentDiv.id !== "dismissable") continue;

      if (!videoIdToDivs[videoId]) {
        videoIdToDivs[videoId] = [];
      }
      videoIdToDivs[videoId].push(parentDiv);
    }

    // get the top comments for this video
    // TODO: fetch this on tooltip hover
    // const xhr = new XMLHttpRequest();
    // xhr.open(
    //   "GET",
    //   youtubeBaseUrl +
    //     `commentThreads?key=${youtubeAPIKey}&part=id,snippet&maxResults=100&textFormat=plainText&videoId=${hrefString}`,
    //   true
    // );

    const compactedVideoIdList = getPaginatedVideoIds(
      Object.keys(videoIdToDivs)
    );

    let x = 1; // DEBUG PURPOSES ONLY
    if (x === 1) {
      for (let compactedVideoIds of compactedVideoIdList) {
        await processVideosList(compactedVideoIds);
      }

      // insert the new divs with the video information
      for (let videoId of Object.keys(videoIdToDivs)) {
        for (let parentDiv of videoIdToDivs[videoId]) {
          const videoInfo = videoInformation[videoId];

          const div = document.createElement("div");
          div.id = videoId;
          strayDivIds.push(div.id);
          parentDiv.appendChild(div);

          div.style.position = "absolute";
          div.style.padding = "3px";

          // set the background color based on like percentage
          div.style.background = "green";
          div.style.color = "white";
          if (videoInfo.likePercentage < 60) {
            div.style.background = "red";
          } else if (videoInfo.likePercentage < 90) {
            div.style.background = "yellow";
            div.style.color = "black";
          }

          // set the info on the div
          div.textContent = `${videoInfo.likes} \\ ${
            videoInfo.likePercentage
          }% \\ ${
            videoInfo.commentCount == -1
              ? "Comments Disabled"
              : videoInfo.commentCount
          }`;

          // TODO: test tooltip
          div.onmouseover = function() {
            div.title = "HELLO WORLD!!!";
          };
        }
      }
    }

    // return the dom back to backgrounds.js
    sendResponse({ dom: document });
  }

  sendResponse({
    msg: "Error: content.js received unexpected message from sender:",
    sender: sender
  });
});
