function registerShow(){
    $('#loginForm').hide();
    $('#registerForm').show();
}

function loginShow(){
    $('#registerForm').hide();
    $('#loginForm').show();
}

function forgotPass(){
    alert("Whoops! This functionality doesn't exist yet. Don't forget your password!");
}

function resendKey(){
    alert("Whoops! This functionality doesn't exist yet. Don't lose your activation key!");
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
        if (form.checkValidity() === false || document.getElementById('nameTaken').innerHTML.includes('Sorry') || document.getElementById('message1').innerHTML.includes('Password')) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

var check = function() {
    var password = document.getElementById('password');
    var match = document.getElementById('confirmation');
    var message = document.getElementById('message2');
    if (match && match.value) {
        if (password.value == match.value) {
            message.style.color = '#28a745';
            message.innerHTML = 'Passwords match!';
      } else {
            message.style.color = '#dc3545';
            message.innerHTML = 'Passwords do not match';
        }
    } else {
        message.innerHTML = '';
    }
};

var passCheck = function() {
    var password = document.getElementById('password');
    var message = document.getElementById('message1');
    var specChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];

    if (password.value.length < 8) {
        message.style.color = '#dc3545';
        message.innerHTML = 'Password must be at least 8 characters long!';
    }
    else if (!specChars.some(spec => password.value.includes(spec))) {
        message.style.color = '#dc3545';
        message.innerHTML = 'Password must contain at least one special character: !@#$%^&*()';
    }
    else if (!/\d/.test(password.value)) {
        message.style.color = '#dc3545';
        message.innerHTML = 'Password must contain at least one number!';
    }
    else if (!/[a-zA-Z]/.test(password.value)) {
        message.style.color = '#dc3545';
        message.innerHTML = 'Password must contain at least one letter!';
    }
    else {
        message.innerHTML = '';
    }
};

function nameCheck(username)
{
    if (username == "")
    {
        $('#nameTaken').html('');
        $('#userName').css('border-color', '#ced4da');
        return;
    }

    $.ajax({
        method: "POST",
        url: "/check",
        data: {username: username},
        success: function (result) {
            if (result == false)
                {
                    if (username != null)
                    {
                        $('#nameTaken').html('Sorry, ' + '"' + username + '"' + ' is taken.');
                        $('#nameTaken').css('color', '#dc3545');
                        $('#userName').css('border-color', '#dc3545');
                    }
                    else
                    {
                        $('#nameTaken').html('Sorry, ' + '"' + username + '"' + ' is not a valid username.');
                        $('#nameTaken').css('color', '#dc3545');
                    }
                }
            else if (result == true)
                {
                    $('#nameTaken').html('Hooray, ' + '"' + username + '"' + ' is available!');
                    $('#nameTaken').css('color', '#28a745');
                    $('#userName').css('border-color', '#28a745');
                }
        }
    });
}