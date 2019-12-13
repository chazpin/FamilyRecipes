$(document).ready(function() {
    $('body').on('click', '.ingredient', function () {
          $(".autoComp").autocomplete({
        source:function(request, response) {
            $.getJSON("/autocomplete",{
                q: request.term, // in flask, "q" will be the argument to look for using request.args
            }, function(data) {
                response(data.matching_results); // matching_results from jsonify
            });
        },
        minLength: 2
    });
  });

    $('#add').click(function() {
        // Track intId by assigning data element "idx" to a div
        // The invalidMsg is the last div element added
        // div:last will access the invalidMsg div which is where the "idx" intId data is held
        var recipeID = $("#recipeIDHidden").val();
        var lastField = $('#newIngredients div:last');
        var intId = (lastField && lastField.length && lastField.data("idx") + 1) || 1;
        var fieldWrapper = $("<div class=\"form-group row ingredientRow newIngredient\" id=\"field" + intId + "\"/>");
        var fIngredient = $("<input type=\"text\" class=\"form-control col-4 ingredient autoComp\" id=\"ingredient" + intId + "\" name=\"ingredient" + intId + "\" required autocomplete=\"Off\"/>");
        var fAmount = $("<input type=\"text\" class=\"form-control col-2 offset-1 amount\" id=\"amount" + intId + "\" name=\"amount" + intId + "\" required/>");
        var fMeasure = $("input[id=measure" + recipeID + "]").clone().attr("id", "measure" + intId).attr("name", "measure" + intId).attr("value", "");
        var invalidMsg = $("<div class=\"invalid-feedback\">Please provide an ingredient name, measure and amount for all ingredients</div>");
        invalidMsg.data("idx", intId);
        var removeButton = $("<input type=\"button\" class=\"btn btn-danger col-1 offset-1\" id=\"btnRemove" + intId + "\" value=\"Remove\" />");

        fieldWrapper.append(fIngredient);
        fieldWrapper.append(fAmount);
        fieldWrapper.append(fMeasure);
        fieldWrapper.append(removeButton);
        fieldWrapper.append(invalidMsg);
        $('#newIngredients').append(fieldWrapper);

        // Remove the previous remove button so only last new ingredient shown can be removed
        $("#btnRemove" + (intId - 1)).remove();

        // The initial selector $(".test") must be a parent of the selector specified as the second parameter in on().
        // Or, as specified in the documention of on(), the second parameter selector must be a descendant of the parent selector.
        // https://stackoverflow.com/questions/6658752/click-event-doesnt-work-on-dynamically-generated-elements
        // Handle removing the row and adding back the remove button to new last row
        $('#field' + intId).on('click', '#btnRemove' + intId, function() {
            $(this).parent().remove();
            $("#measure" + (intId - 1)).after("<input type=\"button\" class=\"btn btn-danger col-1 offset-1\" id=\"btnRemove" + (intId -1) + "\" value=\"Remove\" />");
        });
    });
});

// Using progress bar instead
// function showLoading(){
//     $("body").addClass("loading");
// }

// function hideLoading(){
//     $("body").removeClass("loading");
// }

// AJAX method to handle recipe updates
function editRecipe(recipe_id, fieldName, ingredient_id, measure_id){

    var fieldText = $("#" + fieldName).val() || "";
    var ingredientName = $("#ingredient" + recipe_id).val() || "";
    var amountValue = $("#amount" + recipe_id).val() || "";
    var measureValue = $("#measure" + recipe_id).val() || "";

    $.ajax({
    url: recipe_id, //edit prefix must be included in base url since we're making the ajax request from that page
    data: {
        field: fieldName,
        recipeUpdate: fieldText,
        ingredient: ingredientName,
        ingredient_id: ingredient_id,
        amount: amountValue,
        measure: measureValue,
        measure_id: measure_id
    },
    type: "POST",
    datatype: "string"
})

    .done(function( string ) {
        $('#dialogSuccess').dialog({
            title: "Success!",
            dialogClass: 'successHeader',
            show: {
                effect: "blind",
                duration: 500
            },
            hide: {
                effect: "blind",
                duration: 500
            },
            buttons: {
                Ok: function(){
                    $(this).dialog("close");
                }
            }
        });
    })

    .fail(function( xhr, status, errorThrown ) {
        $('#dialogFail').dialog({
            title: "Oops!",
            dialogClass: 'failHeader',
            classes: {
                "ui-widget-header": "failHeader"
            },
            show: {
                effect: "blind",
                duration: 500
            },
            hide: {
                effect: "blind",
                duration: 500
            },
            buttons: {
                Ok: function(){
                    $(this).dialog("close");
                }
            }
        });
        console.log( "Error: " + errorThrown );
        console.log( "Status: " + status );
        console.dir( xhr );
    });
}

$(function() {
    var ID = $("#recipeIDHidden").val(); // Mimic the functionality in the new.js file
    $('#fileupload').fileupload({
        url: 'uploadEdit/' + ID,
        dataType: 'json',
        add: function(e, data) {
            resetProgBar();
            data.submit();
            // showLoading();
        },
        progress: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
                ).attr('aria-valuenow', progress);
        },
        success: function(response, status) {
            // hideLoading();
            // var filePath = '/static/images/' + response.filename; Local Only

            $('#recipeImg').attr('src',response.url);
            $('#lightboxImg').attr('href', response.url);
            $('#lightboxImg').attr('data-lightbox', response.url.split('?')[0]);
            $('#filePath').val(response.url.split('?')[0]);

            console.log('success');
            $('#progress .progress-bar').attr('class', 'bg-success');
            $('#upMsg').html("Upload Complete!").css('color', '#28a745');

            // Replaced pop-up modal with progress bar
            // $('#dialogSuccess').dialog({
            //     title: "Success!",
            //     dialogClass: 'successHeader',
            //     show: {
            //         effect: "blind",
            //         duration: 500
            //     },
            //     hide: {
            //         effect: "blind",
            //         duration: 500
            //     },
            //     buttons: {
            //         Ok: function(){
            //             $(this).dialog("close");
            //         }
            //     }
            // });
        },
        error: function(error) {
            // hideLoading();
            console.log(error);

            $('#progress .progress-bar').attr('class', 'bg-danger');
            $('#upMsg').html("Upload Failed!").css('color', '#dc3545');

            // Replaced pop-up modal with progress bar
            // $('#dialogFail').dialog({
            //     title: "Oops!",
            //     dialogClass: 'failHeader',
            //     classes: {
            //         "ui-widget-header": "failHeader"
            //     },
            //     show: {
            //         effect: "blind",
            //         duration: 500
            //     },
            //     hide: {
            //         effect: "blind",
            //         duration: 500
            //     },
            //     buttons: {
            //         Ok: function(){
            //             $(this).dialog("close");
            //         }
            //     }
            // });
        }
    });
});

function resetProgBar(){

  $('#progress .bg-danger').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
  $('#progress .bg-success').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
  $('#upMsg').html("");

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
                var numIngredients = $('div.newIngredient').length;
                var hiddenInput = "<input type=\"hidden\" id=\"numIngredients\" name=\"numIngredients\" value=" + numIngredients + ">";
                $("#newIngredients").append(hiddenInput);
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();