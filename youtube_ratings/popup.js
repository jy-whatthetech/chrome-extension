document.addEventListener("DOMContentLoaded", documentEvents, false);

function documentEvents() {
  document
    .getElementById("commentsSlider")
    .addEventListener("input", function() {
      const val = document.getElementById("commentsSlider").value;
      window.commentsToDisplay = val;

      document.getElementById(
        "commentsLabel"
      ).innerText = `Number of comments to display: ${val}`;
    });

  document
    .getElementById("ratingsSlider")
    .addEventListener("input", function() {
      const val = document.getElementById("ratingsSlider").value;
      window.ratingsToFilter = val;

      document.getElementById(
        "ratingsLabel"
      ).innerText = `Filter out videos below: ${val}%`;
    });
}
