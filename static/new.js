$(document).ready(function() {
  $('body').on('click', '.ingredient', function () {
          $(".autoComp").autocomplete({
        source:function(request, response) {
            $.getJSON("autocomplete",{
                q: request.term, // in flask, "q" will be the argument to look for using request.args
            }, function(data) {
                response(data.matching_results); // matching_results from jsonify
            });
        },
        minLength: 2
    });
  });

    $("#add").click(function() {
        // Track intId by assigning data element "idx" to a div
        // The invalidMsg is the last div element added
        // div:last will access the invalidMsg div which is where the "idx" intId data is held
        var lastField = $("#addIngredients div:last");
        var intId = (lastField && lastField.length && lastField.data("idx") + 1) || 2;
        var fieldWrapper = $("<div class=\"form-group row ingredientRow\" id=\"field" + intId + "\"/>");
        var fIngredient = $("<input type=\"text\" class=\"form-control col-4 ingredient autoComp\" id=\"ingredient" + intId + "\" name=\"ingredient" + intId + "\" required autocomplete=\"Off\"/>");
        var fAmount = $("<input type=\"text\" class=\"form-control col-2 offset-1 amount\" id=\"amount" + intId + "\" name=\"amount" + intId + "\" required/>");
        var fMeasure = $("#measure1").clone().attr("id", "measure" + intId).attr("name", "measure" + intId);
        var invalidMsg = $("<div class=\"invalid-feedback\">Please provide an ingredient name, measure and amount for all ingredients</div>");
        invalidMsg.data("idx", intId);
        var removeButton = $("<input type=\"button\" class=\"btn btn-danger col-1 offset-1\" value=\"Remove\" />");
        removeButton.click(function() {
            $(this).parent().remove();
        });
        fieldWrapper.append(fIngredient);
        fieldWrapper.append(fAmount);
        fieldWrapper.append(fMeasure);
        fieldWrapper.append(removeButton);
        fieldWrapper.append(invalidMsg);
        $("#addIngredients").append(fieldWrapper);
    });
});

$(document).on("change", "#fileupload", function () {

  if ($('#fileupload').prop('files').length != 0){
    var file = $('#fileupload').prop('files')[0];
    console.log("file1 handler",$(this))
  }
});


$(function () {
    $('#fileupload').fileupload({
        url: 'upload',
        dataType: 'json',
        type: 'GET',
        add: function(e, data) {
            data.submit(); // GET request to the upload method which will get signed AWS request -- Needs to return json dumps
        },
        success: function(response, status) { // Add the uploadFile example here
            // file is not here
            console.log(file);
            uploadFile(file, response.data, response.url);

              // var filePath = './static/images/' + response.filename;  Local Only
              console.log('success');
        },
        error: function(error) {
            console.log(error);
        }
    });
});

function uploadFile(file, s3Data, url){
  var xhr = new XMLHttpRequest();
  xhr.open("POST", s3Data.url);

  var postData = new FormData();
  for(key in s3Data.fields){
    postData.append(key, s3Data.fields[key]);
  }
  postData.append('file', file);

  xhr.onreadystatechange = function() {
    if(xhr.readyState === 4){
      if(xhr.status === 200 || xhr.status === 204){
        $('#imgUpload').attr('src',xhr.response.url);
        $('#filePath').val(xhr.response.url);
      }
      else{
        alert("Could not upload file.");
      }
   }
  };
  xhr.send(postData);
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function() {
  'use strict';
  window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        // Only add the number of ingerdients hidden input if validation was passed
        else {
                var numIngredients = $('div.ingredientRow').length;
                var hiddenInput = "<input type=\"hidden\" id=\"numIngredients\" name=\"numIngredients\" value=" + numIngredients + ">";
                $("#addIngredients").append(hiddenInput);
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();