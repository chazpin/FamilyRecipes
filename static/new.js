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
        var columnDivIngred = $("<div class=\"col-md-4 noPadLeft\"/>");
        var columnDivAmt = $("<div class=\"col-md-2 noPadLeft\"/>");
        var columnDivMeas = $("<div class=\"col-md-2 noPadLeft\"/>");
        var columnDivRmv = $("<div class=\"col-md-4 noPadLeft\"/>");
        var fIngredLabel = $("<label class=\"label\" for=\"ingredient" + intId + "\">Ingredient</label>");
        var fIngredient = $("<input type=\"text\" class=\"form-control ingredient autoComp\" id=\"ingredient" + intId + "\" name=\"ingredient" + intId + "\" required autocomplete=\"Off\"/>");
        var fAmtLabel = $("<label class=\"label\" for=\"amount" + intId + "\">Amount</label>");
        var fAmount = $("<input type=\"text\" class=\"form-control amount\" id=\"amount" + intId + "\" name=\"amount" + intId + "\" required/>");
        var fMeasLabel = $("<label class=\"label\" for=\"measure" + intId + "\">Measure</label>");
        var fMeasure = $("#measure1").clone().attr("id", "measure" + intId).attr("name", "measure" + intId);
        var invalidMsg = $("<div class=\"invalid-feedback\">Please provide an ingredient name, measure and amount for all ingredients</div>");
        invalidMsg.data("idx", intId);
        var blankLabel = $("<label class=\"label\" for=\"rmvBtn" + intId + "\">&nbsp;</label>");
        var removeButton = $("<input type=\"button\" class=\"form-control btn-danger btnRight\" id=\"rmvBtn" + intId + "\" value=\"Remove\" />");
        removeButton.click(function() {
            $(this).parent().parent().remove();
        });
        columnDivIngred.append(fIngredLabel);
        columnDivIngred.append(fIngredient);
        columnDivAmt.append(fAmtLabel);
        columnDivAmt.append(fAmount);
        columnDivMeas.append(fMeasLabel);
        columnDivMeas.append(fMeasure);
        columnDivRmv.append(blankLabel);
        columnDivRmv.append(removeButton);
        fieldWrapper.append('<hr style=\"width:100%\">', columnDivIngred, columnDivAmt, columnDivMeas, columnDivRmv);
        fieldWrapper.append(invalidMsg);
        $("#addIngredients").append(fieldWrapper);
    });
});


$(function () {
    $('#fileupload').fileupload({
        url: 'upload',
        dataType: 'json',
        type: 'POST',
        add: function(e, data) {
            resetProgBar();
            data.submit(); // GET request to the upload method which will get signed AWS request -- Needs to return json dumps
        },
        progress: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            ).attr('aria-valuenow', progress);
        },
        success: function(response, status) { // Add the uploadFile example here
            $('#imgUpload').attr('src',response.url);
            $('#filePath').val(response.url.split('?')[0].split('.com/')[1]); // get only the filename saved to S3 bucket

            // uploadFile(file, response.data, response.url);

            // var filePath = './static/images/' + response.filename;  Local Only
            console.log('success');
            $('#progress .progress-bar').attr('class', 'bg-success');
            $('#upMsg').html("Upload Complete!").css('color', '#28a745');
        },
        error: function(error) {
            console.log(error);
            $('#progress .progress-bar').attr('class', 'bg-danger');
            $('#upMsg').html("Upload Failed!").css('color', '#dc3545');
        }
    });
});

function resetProgBar(){

  $('#progress .bg-danger').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
  $('#progress .bg-success').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
  $('#upMsg').html("");

}

// No longer used. Sending upload from server side
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