// Get all articles
function getArticles() {
  $.getJSON("/articles", function (data) {
    for (var i = 10; i < data.length; i++) {
      $("#articles-display").append(
        `
        <div class="card text-white bg-info mb-3">
        <div class="card-header">
            <h3 class="title">${data[i].headline}</h3>
            <a class="link" href="${data[i].URL}">View Full Article</a>
            <h4>${data[i].summary}</h4>
            <button class="btn btn-secondary data-id='${data[i]._id}'" id="save-article">Save Article</button>
        </div>
    </div>
          `
      );

    }
  });
}
getArticles();

// Attach click handler for SCRAPE NEW button
$(".scrape-new").on("click", function() {

  $("#articles-display").empty();

  $.ajax({
      method: "DELETE",
      url: "/articles/deleteAll"
  }).done(function() {
      $.ajax({
          method: "GET",
          url: "/scrape"
      }).done(function(data) {
          console.log(data);
          alert('You scraped!')
          location.reload();
      });

  });

});



// Whenever someone clicks a p tag
$(document).on("click", "p", function () {
  // Empty the notes from the note section
  $("#comments").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      // The title of the article
      $("#comments").append("<h2>" + data.headline + "</h2>");
      // An input to enter a new title
      $("#comments").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#comments").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function (data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#notes").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});
