window.strayDivIds = [];

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.text === "report_back") {
    // perform cleanup
    for (let strayDivId of window.strayDivIds) {
      const strayDiv = document.getElementById(strayDivId);
      if (strayDiv) {
        strayDiv.remove();
      }
    }
    window.strayDivIds = [];

    const anchors = document.getElementsByTagName("a");
    const hrefs = new Set();
    let hrefString = "";
    const idToParentDiv = {};
    for (let anchor of anchors) {
      const link = anchor.href;
      if (link.indexOf("?v=") !== -1) {
        const start = link.indexOf("?v=") + 3;

        let end = link.length;
        if (link.indexOf("&t=") !== -1) {
          end = link.indexOf("&t=");
        }

        // TODO: create a regex that can filter out invalid filters
        // if (link.indexOf("&", start) !== -1) {
        //   end = link.indexOf("&", start);
        // }

        // console.log(link);
        const videoId = link.slice(start, end);
        // console.log(videoId);

        if (!hrefs.has(videoId)) {
          hrefs.add(videoId);
          if (hrefString.length === 0) {
            hrefString = videoId;
          } else {
            hrefString += ",";
            hrefString += videoId;
          }

          const parentDiv = anchor.closest("div");
          idToParentDiv[videoId] = parentDiv;
        }
      }
    }

    if (1 === 1) {
      const xhr = new XMLHttpRequest();
      let youtubeAPIKey = "AIzaSyA3ye42GDk4SfBRNwsgrOscNmwxS0kr7Ao";

      xhr.open(
        "GET",
        `https://www.googleapis.com/youtube/v3/videos?key=${youtubeAPIKey}&part=snippet,contentDetails,statistics&id=${hrefString}`,
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
              let commentCnt = parseInt(item.statistics.commentCount);
              // if (isNaN(commentCnt)) {
              //   commentCnt = 0;
              // }

              let likePercentage = 100;
              if (likes + dislikes > 0) {
                likePercentage = Math.round((likes / (likes + dislikes)) * 100);
              }
              console.log(
                `likes: ${likes} dislikes: ${dislikes}  Like Percentage: ${likePercentage}`
              );

              // decorate the divs with the ratings info
              const div = document.createElement("div");
              div.id = item.id;
              window.strayDivIds.push(div.id);

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

              div.textContent = `${likes} \\ ${likePercentage}% \\ ${commentCnt}`;

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
