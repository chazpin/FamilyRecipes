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
        var columnDivIngred = $("<div class=\"col-md-4 noPadLeft\"/>");
        var columnDivAmt = $("<div class=\"col-md-2 noPadLeft\"/>");
        var columnDivMeas = $("<div class=\"col-md-2 noPadLeft\"/>");
        var columnDivRmv = $("<div class=\"col-md-4 noPadLeft\" id=\"removeDiv" + intId + "\"/>");
        var columnDivRmv2 = $("<div class=\"float-right\"/>");
        var fIngredLabel = $("<label class=\"label\" for=\"ingredient" + intId + "\">Ingredient</label>");
        var fIngredient = $("<input type=\"text\" class=\"form-control ingredient autoComp\" id=\"ingredient" + intId + "\" name=\"ingredient" + intId + "\" required autocomplete=\"Off\"/>");
        var fAmtLabel = $("<label class=\"label\" for=\"amount" + intId + "\">Amount</label>");
        var fAmount = $("<input type=\"text\" class=\"form-control amount\" id=\"amount" + intId + "\" name=\"amount" + intId + "\" required/>");
        var fMeasLabel = $("<label class=\"label\" for=\"measure" + intId + "\">Measure</label>");
        var fMeasure = $("input[id=measure" + recipeID + "]").clone().attr("id", "measure" + intId).attr("name", "measure" + intId).attr("value", "");
        var invalidMsg = $("<div class=\"invalid-feedback\">Please provide an ingredient name, measure and amount for all ingredients</div>");
        invalidMsg.data("idx", intId);
        var blankLabel = $("<label class=\"label\" for=\"rmvBtn" + intId + "\">&nbsp;</label>");
        var removeButton = $("<input type=\"button\" class=\"form-control btn-danger rmvBtn\" id=\"btnRemove" + intId + "\" value=\"Remove\" />");

        columnDivIngred.append(fIngredLabel);
        columnDivIngred.append(fIngredient);
        columnDivAmt.append(fAmtLabel);
        columnDivAmt.append(fAmount);
        columnDivMeas.append(fMeasLabel);
        columnDivMeas.append(fMeasure);
        columnDivRmv2.append(blankLabel);
        columnDivRmv2.append(removeButton);
        columnDivRmv.append(columnDivRmv2);
        fieldWrapper.append('<hr style=\"width:100%\">', columnDivIngred, columnDivAmt, columnDivMeas, columnDivRmv);
        fieldWrapper.append(invalidMsg);
        $('#newIngredients').append(fieldWrapper);

        // Remove the previous remove button so only last new ingredient shown can be removed
        $("#btnRemove" + (intId - 1)).remove();

        // The initial selector $(".test") must be a parent of the selector specified as the second parameter in on().
        // Or, as specified in the documention of on(), the second parameter selector must be a descendant of the parent selector.
        // https://stackoverflow.com/questions/6658752/click-event-doesnt-work-on-dynamically-generated-elements
        // Handle removing the row and adding back the remove button to new last row
        $('#field' + intId).on('click', '#btnRemove' + intId, function() {
            $(this).parent().parent().parent().remove();
            $("#removeDiv" + (intId - 1)).html("<div class=\"float-right\"><label class=\"label\" for=\"rmvBtn" + intId + "\">&nbsp;</label><input type=\"button\" class=\"form-control btn-danger rmvBtn\" id=\"btnRemove" + (intId -1) + "\" value=\"Remove\" /></div>");
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

// AJAX method to handle removing uploaded images
function removeImg(recipeId, imgId){
    $.ajax({
        url: 'removeImg/' + imgId,
        type: 'POST',
        data:{
            recipeId
        },
        datatype: 'string',
        success: function() {
            $('#photoDiv'+ imgId).remove(); // remove the img html from the page
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
        },
        error: function( xhr, status, errorThrown ) {
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
        }
    });
}

// AJAX method to handle recipe updates
function editRecipe(recipe_id, fieldName, ingredient_id, measure_id){

    var fieldText = $("#" + fieldName).val() || "";
    var ingredientName = $("#ingredient" + recipe_id).val() || "";
    var amountValue = $("#amount" + recipe_id).val() || "";
    var measureValue = $("#measure" + recipe_id).val() || "";

    $.ajax({
    url: recipe_id, //edit prefix is already included in base url since we're making the ajax request from that page
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

$(function () {
    var ID = $("#recipeIDHidden").val();
    var newPhotoRow = "<div class=\"form-group row\" id=\"photoDiv\"><div class=\"input-group\" style=\"display: inline-block;\">" +
    "<img id=\"imgUpload\" style=\"width: 140px; height: 140px; margin-bottom: 5px;\" class=\"img-thumbnail\"><input type=\"hidden\" name=\"filePath\" id=\"filePath\">" +
    "</input><input type=\"hidden\" name=\"imgIDHidden\" id=\"imgIDHidden\"></input><div class=\"pull-right\" style=\"float: right\"><span class=\"input-group-btn\">" +
    "<span class=\"btn btn-primary btn-file\">Add Photo <input type=\"file\" id=\"fileuploadNEW\" name=\"fileuploadNEW\"></span></span></div>" +
    "<div  class=\"progress active\" style=\"width: 140px; height: 10px;\" id=\"progress\">" +
    "<div class=\"progress-bar progress-bar-striped progress-bar-animated\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\" aria-valuenow=\"0\" style=\"width: 0%;\">" +
    "</div></div></div><div><span id=\"upMsg\" style=\"font-size: 12px;\"></span></div></div>";

    $('#fileuploadNEW').fileupload({
        url: 'upload/' + ID,
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
            // Set the new attributes to the only non-id'd parameters, them update them with their new ids so we can add another add photo template
            var updateRmvRow = "<span class=\"input-group-btn\"><span class=\"btn btn-warning btn-file\">" +
            "Update <input type=\"file\" id=\"fileuploadEDIT\" name=\"fileuploadEDIT\" ></span>" +
            "<input type=\"button\" class=\"btn btn-danger btn-file\" id=\"btnRemove" + response.imgID +
            " onclick=\"removeImg(" + response.recipeID + "," + response.imgID +"); value=\"Remove\" ></span>"


            $('#imgUpload').attr('src',response.url);
            $('#imgUpload').attr('id', 'recipeImg' + response.imgID);

            $('#imgIDHidden').val(response.imgID);
            $('#imgIDHidden').attr('id', 'imgIDHidden' + response.imgID);

            $('#lightboxImg').attr('href', response.url);
            $('#lightboxImg').attr('data-lightbox', response.recipeID);
            $('#lightboxImg').attr('id', 'lightboxImg' + response.imgID);

            $('#filePath').val(response.url.split('?')[0].split('.com/')[1]); // get only the filename saved to S3 bucket
            $('#filePath').attr('id', 'filePath' + response.imgID);

            $('#photoDiv').attr('id', 'photoDiv' + response.imgID);

            // var filePath = './static/images/' + response.filename;  Local Only
            console.log('success');
            $('#progress .progress-bar').attr('class', 'bg-success');
            $('#progress .progress-bar').attr('id', 'progress' + response.imgID)
            $('#upMsg').html("Upload Complete!").css('color', '#28a745');
            $('#upMsg').attr('id', 'upMsg' + response.imgID)

            // Remove 'Add New' button and add Update/Remove buttons to newly added photo
            $('#btnRow > pull-right').remove();
            $('#btnRow').append(updateRmvRow);
            $('#btnRow').attr('id', 'btnRow' + response.imgID);

            // Need to add a new file upload row
            $('#photoDiv' + response.imgID).append(newPhotoRow);

        },
        error: function(error) {
            console.log(error);
            $('#progress .progress-bar').attr('class', 'bg-danger');
            $('#upMsg').html("Upload Failed!").css('color', '#dc3545');
        }
    });
});

$(function() {
    var ID = $("#recipeIDHidden").val(); // Mimic the functionality in the new.js file
    var imgID = $("#imgIDHidden").val();
    $('#fileuploadEDIT').fileupload({
        url: 'uploadEdit/' + ID + '/' + imgID,
        dataType: 'json',
        add: function(e, data) {
            resetProgBar(imgID);
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

            $('#recipeImg' + imgID).attr('src',response.url);
            $('#lightboxImg' + imgID).attr('href', response.url);
            $('#lightboxImg' + imgID).attr('data-lightbox', response.recipeID);
            $('#filePath' + imgID).val(response.url.split('?')[0].split('.com/')[1]);

            console.log('success');
            $('#progress' + imgID + ' .progress-bar').attr('class', 'bg-success');
            $('#upMsg' + imgID).html("Upload Complete!").css('color', '#28a745');

        },
        error: function(error) {
            // hideLoading();
            console.log(error);

            $('#progress' + imgID + ' .progress-bar').attr('class', 'bg-danger');
            $('#upMsg' + imgID).html("Upload Failed!").css('color', '#dc3545');
        }
    });
});

function resetProgBar(imgID){
    if (imgID == null){
        $('#progress .bg-danger').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
        $('#progress .bg-success').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
        $('#upMsg').html("");
    }
    else{
        $('#progress' + imgID + ' .bg-danger').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
        $('#progress' + imgID + ' .bg-success').css('width', 0).attr('aria-valuenow', 0).attr('class', 'progress-bar progress-bar-striped progress-bar-animated');
        $('#upMsg' + imgID).html("");
    }
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