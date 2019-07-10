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

$(function() {
    $('#fileupload').fileupload({
        url: 'upload',
        dataType: 'json',
        add: function(e, data) {
            data.submit();
        },
        success: function(response, status) {
            console.log(response.filename);
              var filePath = './static/images/' + response.filename;
              $('#imgUpload').attr('src',filePath);
              $('#filePath').val(filePath);
              console.log('success');
        },
        error: function(error) {
            console.log(error);
        }
    });
});

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