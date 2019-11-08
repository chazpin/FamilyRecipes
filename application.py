# Upload project to Heroku for free app hosting
# https://cs50.readthedocs.io/heroku/
# Project Submission Instructions here -- https://docs.cs50.net/2019/x/project/project.html
import os
import json
import secrets
import string
import smtplib

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session, url_for
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from collections import defaultdict
import datetime
from datetime import datetime
from mailjet_rest import Client

from helpers import login_required, apology, allowed_file

UPLOAD_FOLDER = './static/images/'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Mailjet account configuration
api_key = '94c3d2170fef4a6e441de7e1db3af03d'
api_secret = '03e0e888a1cd88e977a38a10c4fb1c23'

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
# Recipe Data Model - https://gist.github.com/greghelton/1546514
db = SQL("sqlite:///recipe.db")
db.execute("PRAGMA foreign_keys = ON")

# Configure Email Address

@app.route("/register", methods=["GET", "POST"])
def register():
    specList = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"]
    userName = request.form.get("username")
    userEmail = request.form.get("email")

    """Register user"""
    # direct user to register page
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("You must select a username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("You must provide a password", 400)

        # Ensure passwords match
        elif (request.form.get("password") != request.form.get("confirmation")):
            return apology("Your passwords did not match", 400)

        # Validate password credentials: length > 8, one number, letter, spec char
        elif len(request.form.get("password")) < 8:
            return apology("Password must be at least 8 characters long")

        elif (request.form.get("password").isdigit()):
            return apology("Password must contain at least one letter and specical character")

        elif (request.form.get("password").isalpha()):
            return apology("Password must contain at least one number and special character")

        elif not any(specChars in request.form.get("password") for specChars in specList):
            return apology("Password must contain at least one special character: !@#$%^&*()")

        # Query database to see if username exists
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Username exists, prompt for different user name
        if len(rows) != 0:
            flash("Sorry, " + "'" + request.form.get("username") + "'" + " is taken.", 'danger')
            # return redirect("register")
            return apology("Username taken", 400)
        # Username is available. Save username and hashed password in database. Send email message with code for user to enter on activation page
        else:
            # https://docs.python.org/3/library/secrets.html
            alphabet = string.ascii_letters + string.digits
            while True:
                newKey = ''.join(secrets.choice(alphabet) for i in range(10))
                if (any(c.islower() for c in newKey)
                        and any(c.isupper() for c in newKey)
                        and sum(c.isdigit() for c in newKey) >= 3):
                    break

            db.execute("INSERT INTO users (username, hash, email, activation_key) VALUES (:username, :hashed, :email, :activationKey)", username=request.form.get(
                "username"), hashed=generate_password_hash(request.form.get("password"), method="pbkdf2:sha256", salt_length=8), email=userEmail, activationKey=newKey)

            # Send email to new user with link to activation page and key via MailJet
            # https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-xi-email-support
            mailjet = Client(auth=(api_key, api_secret), version='v3.1')
            data = {
              'Messages': [
                {
                  "From": {
                    "Email": "FamilyRecipesRobot@gmail.com",
                    "Name": "Frank the Family Recpies Robot"
                  },
                  "To": [
                    {
                      "Email": userEmail
                    }
                  ],
                  "Subject": "Family Recipes Account Activation",
                  "TextPart": "Welcome to the Famnily Recpies App!",
                  "HTMLPart": "<h3>Dear " + userName + ", welcome to the Family Recipes App!</h3><br />There's just one more quick step." +
                  " Click on the link below to confirm your email address. Then you can begin using the Family Recipes App!<br /><br />" +
                  request.url_root[:-1] + # Remove the trailing / from the root url. A leading / is applied from the url_for method
                  url_for('activation', name=userName, email=userEmail, key=newKey) +
                  " We're so happy you're here!<br /> --Frank & The Family Recipes Team",
                  "CustomID": "AppGettingStartedTest"
                }
              ]
            }
            result = mailjet.send.create(data=data)
            print (result.status_code)
            print (result.json())

            # Redirect user to activation page and flash login success message
            flash("Hooray, you were successfully registered! We've sent a message to the email address you provided that contains a link to confirm your account registration. " +
                    "Follow the link in the email to begin using Family Recipes or click below to enter the key manually.", 'success')
            return render_template("activation.html")

    # handle new user registration submission
    else:
        return render_template("landing.html")

@app.route("/activation", methods=["GET", "POST"])
def activation():

    # Activate the user's newly registered account via the email link via GET
    if request.method == "GET":
        # Get user information from url
        name = request.args.get("name")
        email = request.args.get("email")
        key = request.args.get("key")

        if not name or not email or not key:
            flash('Oops! There was something wrong with the URL entered. Try entering your information manually in the fields below.', 'danger')
            return render_template("activation.html")
        else:
            # Get account info to check the email account is not currently activated and key matches
            accountInfo = db.execute("SELECT * FROM users WHERE email = :email AND username = :username",
                email=email, username=name)

            if len(accountInfo) != 1:
                return apology("We can't find your account information in our database. Check your User Name and Email and try again.", 400)
            if accountInfo[0]["activation_key"] != key:
                return apology("Your account is already active or the activation key provided does not match the one provided to you at registration.", 400)
            if accountInfo[0]["active"] != 0: # Account is already active
                flash ('Your account has already been activated!', 'success')
                session["user_id"] = accountInfo[0]["id"] # Make sure to log user in!
                return redirect("/")

            # Mark users account as active
            db.execute("UPDATE users SET active = 1 WHERE id = :userid", userid=accountInfo[0]["id"])

            # Remember which user has logged in
            session["user_id"] = accountInfo[0]["id"]

            # Redirect user to home page and flash login success message
            ################################ TODO? Add 'time of day' message. ##################################
            flash('Welcome ' + name + '!', 'success')
            return redirect("/")
    else:     # Manual activation of the user's newly registered account via POST
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("You must provide the user name you registered with", 400)
        # Ensure email was submitted
        if not request.form.get("userEmail"):
            return apology("You must provide the email address you registered with", 400)
        # Ensure activation key was submitted
        if not request.form.get("activationKey"):
            return apology("You must provide the activation key provided to you at account registration", 400)
        # Get account info to check that the email account is not currently activated and key matches
        accountInfo = db.execute("SELECT * FROM users WHERE email = :email AND username = :username",
            email=request.form.get("userEmail"), username=request.form.get("username"))

        if len(accountInfo) != 1:
            return apology("We can't find your account information in our database. Check your User Name and Email and try again.", 400)
        if accountInfo[0]["active"] != 0 or accountInfo[0]["activation_key"] != request.form.get("activationKey"):
            return apology("Your account is already active or the activation key provided does not match the one provided to you at registration.", 400)

        # Mark users account as active
        db.execute("UPDATE users SET active = 1 WHERE id = :userid", userid=accountInfo[0]["id"])

        # Remember which userid AND username has logged in
        session["user_id"] = accountInfo[0]["id"]
        session["userName"] = accountInfo[0]["username"]

        # Redirect user to home page and flash login success message
        ################################ TODO? Add 'time of day' message. ##################################
        flash('Welcome ' + request.form.get("username") + '!', 'success')
        return redirect("/")

@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            # Dev method for showing hashes of entered password
            # h = generate_password_hash("test", method="pbkdf2:sha256", salt_length=8)
            # flash(h)
            # can also do error following template here: http://flask.pocoo.org/docs/1.0/patterns/flashing/
            return apology("invalid username and/or password", 403)

        # Need to check if the user account is active -- active = 1, inactive = 0
        if rows[0]["active"] == 0:
            flash("Oops! Your account hasn't been activated yet. You will recieve an email at the address provided when the account review process has completed.", "danger")
            return render_template("activation.html")

        # Remember which userid AND username has logged in
        session["user_id"] = rows[0]["id"]
        session["userName"] = rows[0]["username"]

        # Redirect user to home page and flash login success message
        ################################ TODO? Add 'time of day' message. ##################################
        flash('Welcome ' + request.form.get("username") + '!', 'success')
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("landing.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/login")


@app.route("/", methods=["GET"])
@login_required
def dashboard():
    # Bypass to show the navbar without logging in
    # session.user_id = 1;

    # Get the last 5 recipes added
    lastFive = db.execute("SELECT * FROM recipe ORDER BY date_created desc LIMIT 5")

    # User friendly date conversion
    for date in lastFive:
        # Take date string an convert to a datetime object
        oldStr = datetime.strptime(date['date_created'], '%Y-%m-%d %H:%M:%S')
        # Convert new datetime object to string with the desired format
        newDate = datetime.strftime(oldStr, '%d-%b-%Y  %I:%M:%S %p')
        # Pass the new datetime back into the list
        date['date_created'] = newDate

    # Get ALL of the current user's recipes
    myRecipes = db.execute("SELECT * FROM recipe WHERE user_created = (SELECT username FROM \
                            users WHERE id = :ID)", ID = session.get('user_id'))

    return render_template("dashboard.html", lastFive=lastFive, myRecipes=myRecipes)

@app.route("/search", methods=["GET", "POST"])
@login_required
def search():
    # Bypass to show navbar without logging in
    # session.user_id = 1;

    if request.method == "POST":
        if not request.form.get("searchType"):
            flash("Please select a category to search by")
            return render_template("search.html")
        # Check for blank input
        if not request.form.get("searchText"):
            flash("Please provide some input to search by", 'danger')
            return render_template("search.html")

        # Initialize variables, if specific category is selected other lists throw assignment error
        recipeResults = []
        authorResults = []
        userResults = []
        ingredientResults = []
        anyResults = False

        # Search By: Recipe
        if request.form.get("searchType") == 'recipe' or request.form.get("searchType") == 'all':
            recipeResults = db.execute("SELECT * FROM recipe WHERE name like :userInput",
                            userInput = "%" + request.form.get("searchText").strip() + "%")
            anyResults = True

        # Search By: Author
        if request.form.get("searchType") == 'author' or request.form.get("searchType") == 'all':
            authorResults = db.execute("SELECT * FROM recipe WHERE description like :userInput",
                            userInput = "%" + request.form.get("searchText").strip() + "%")
            anyResults = True

        # Search By: User
        if request.form.get("searchType") == 'user' or request.form.get("searchType") == 'all':
            userResults = db.execute("SELECT * FROM recipe WHERE user_created like :userInput",
                            userInput = "%" + request.form.get("searchText").strip() + "%")
            anyResults = True

        # Search By: Ingredient
        if request.form.get("searchType") == 'ingredient' or request.form.get("searchType") == 'all':
            ingredientResults = db.execute("SELECT r.* FROM recipe r JOIN recipe_ingredient ri \
                                on r.id = ri.recipe_id JOIN ingredient i on i.id = ri.ingredient_id \
                                LEFT OUTER JOIN measure mu on mu.id = measure_id WHERE i.name like :userInput",
                                userInput = "%" + request.form.get("searchText").strip() + "%")
            anyResults = True

        # Pass search results back to template
        return render_template("search.html", recipeResults=recipeResults, authorResults=authorResults,
                                userResults=userResults, ingredientResults=ingredientResults, anyResults=anyResults)

    # GET call
    return render_template("search.html")

@app.route("/cookbook")
@login_required
def mandy():
    #session.user_id = 1;
    return render_template("cookbook.html")

# A recipe id is specified in this route since data from a recipe is required to fill the page
@app.route("/recipe/<int:recipe_id>", methods=["GET", "POST"])
@login_required
def recipe(recipe_id):

    # Bypass to show the navbar without logging in
    #session.user_id = 1;
    #session.username = "chazpin";
    userName = session.get('userName')
    print(userName)

    # Use id to query recipe and recipe ingredient table for data to load onto page
    recipeInfo = db.execute("SELECT * FROM recipe where id = :ID", ID = recipe_id)

    # Get ingredients for recipe using recipe id
    ingredientList = db.execute("SELECT i.name AS ingredient, ri.amount AS amount, mu.name AS measure FROM \
                                recipe r JOIN recipe_ingredient ri on r.id = ri.recipe_id JOIN ingredient i \
                                on i.id = ri.ingredient_id LEFT OUTER JOIN measure mu on mu.id = measure_id \
                                WHERE r.id = :ID", ID = recipe_id)

    return render_template("recipe.html", userName=userName, recipeInfo=recipeInfo, ingredientList=ingredientList)

@app.route("/edit/<int:recipe_id>", methods=["GET", "POST"])
@login_required
def edit(recipe_id):

    #Bypass to show the navbar without logging in
    #session.user_id = 1

    if request.method == "GET":

        # Use id to query recipe and recipe ingredient table for data to load onto page
        recipeInfo = db.execute("SELECT * FROM recipe where id = :ID", ID = recipe_id)

        # Get ingredients for recipe using recipe id
        ingredientList = db.execute("SELECT i.name AS ingredient, i.id AS ingredient_id, ri.amount AS amount, \
                                    ri.recipe_id AS recipe_id, mu.name AS measure, mu.id AS measure_id FROM \
                                    recipe r JOIN recipe_ingredient ri on r.id = ri.recipe_id JOIN ingredient i \
                                    on i.id = ri.ingredient_id LEFT OUTER JOIN measure mu on mu.id = measure_id \
                                    WHERE r.id = :ID", ID = recipe_id)

        # Get list of measurements for dropdown list
        measureList = db.execute("SELECT DISTINCT(name) FROM measure")

        return render_template("edit.html", recipeInfo=recipeInfo, ingredientList=ingredientList, measureList=measureList)

    # POST method triggered with AJAX call
    else:
        # Get field to determine which data to update
        field = request.form.get("field")

        if field: # field gets set from ajax post
            # Determine which field needs updating
            if field == "name" or field == "description" or field == "instructions":
                recipeUpdate = request.form.get("recipeUpdate")
                return updateRecipe(recipe_id, field, recipeUpdate)

            elif field == "ingredients":
                ingredientUpdate = request.form.get("ingredient")
                amountUpdate = request.form.get("amount")
                measureUpdate = request.form.get("measure")
                ingredientID = request.form.get("ingredient_id")
                measureID = request.form.get("measure_id")
                return updateIngredients(recipe_id, ingredientUpdate, ingredientID, amountUpdate, measureUpdate, measureID)

        else: # indicates that its a new ingredient addition to the recipe triggered by the form submission on the edit page
            recipeID = request.form.get("recipeIDHidden")
            results = addNewIngredients(request, recipeID)

            if results == True:
                flash("The new ingredients have been added to your recipe!", "success")
            else:
                flash("There was a problem trying to add the new ingredients", "danger")

            return redirect("/edit/" + recipeID)

@app.route("/new", methods=["GET", "POST"])
@login_required
def new():
    # Bypass to show the navbar without logging in
    # session.user_id = 1;

    """Validate a new recipe"""
    if request.method == "POST":
        # Ensure recipe name was submitted
        if not request.form.get("name"):
            return apology("You must provide a recipe name", 400)
        # Ensure author was submitted
        elif not request.form.get("author"):
            return apology("You must provide an author for your recipe", 400)
        # Ensure instructions were submitted
        elif not request.form.get("instructions"):
            return apology("You must provide some instructions for your recipe", 400)
        elif not request.form.get("ingredient1"):
            return apology("You must provide at least one ingredient for your recipe", 400)
        print(request.form.get("numIngredients"))

        userID = session.get('user_id')
        # Query database for username
        username = db.execute("SELECT username FROM users WHERE id = :user_id",
                          user_id=userID)

        # Check for image upload path before saving to db
        if request.form.get('filePath') is None:
            _filePath = ''
        else:
            _filePath = request.form.get('filePath')

        # Save recipe fields to recipe table
        db.execute("INSERT INTO recipe (name, description, instructions, user_created, date_created, img_file_path)\
                    VALUES (:name, :description, :instructions, :user, :date, :filePath)",
                    name=request.form.get("name"), description=request.form.get("author"), instructions=request.form.get("instructions"),
                    user=username[0]["username"], date=datetime.now(), filePath=_filePath)

        # Hidden field input to determine number of ingredient fields
        ingredients = int(request.form.get("numIngredients"))
        i = 2
        # List of ingredient and measure primary ID keys. Needed to insert the final recipe into recipe ingredients
        ingredientIDs = []
        measureIDs = []

        # Check if ingredient and measure already exist in the DB
        ingredientAdd = ingredientExists(request.form.get("ingredient1"))
        measureAdd = measureExists(request.form.get("measure1"))

        # Ingredient does not exist if return = 0
        if ingredientAdd == 0:
            # Add ingredients to ingredient table
            db.execute("INSERT INTO ingredient (name) VALUES (:name)", name=request.form.get("ingredient1"))
            # Now get the primary key of newly added ingredient
            ingredientKey = db.execute("SELECT id FROM ingredient WHERE name = :ingredientName",
            ingredientName=request.form.get("ingredient1"))
            # Finally add to the list
            ingredientIDs.append(ingredientKey[0]["id"])
        else:
            ingredientIDs.append(ingredientAdd)

        if measureAdd == 0:
            # Add meaures to measure table
            db.execute("INSERT INTO measure (name) VALUES (:name)", name=request.form.get("measure1"))
            # Get primary key of newly added measure
            measureKey = db.execute("SELECT id FROM measure WHERE name = :measureName",
            measureName=request.form.get("measure1"))
            # Add key to list
            measureIDs.append(measureKey[0]["id"])
        else:
            measureIDs.append(measureAdd)

        # Query the db to get the recipe id primary key
        recipeKey = db.execute("SELECT MAX(id) FROM recipe WHERE name = :recipeName AND user_created = :user",
            recipeName=request.form.get("name"), user=username[0]["username"])

        # Now save FIRST ingredient, measure, and amount to the recipe_ingredients table using the ingredient and measure primary keys
        db.execute("INSERT INTO recipe_ingredient (recipe_id, ingredient_id, measure_id, amount) VALUES (:key, :ingredient, :measure, :amount)",
        key=recipeKey[0]["MAX(id)"], ingredient=ingredientIDs[0], measure=measureIDs[0], amount=request.form.get("amount1"))

        while ingredients >= i:
            # Check if ingredient and measure already exist in the DB
            ingredientAdd = ingredientExists(request.form.get("ingredient" + str(i)))
            measureAdd = measureExists(request.form.get("measure" + str(i)))

            # Ingredient does not exist if return = 0
            if ingredientAdd == 0:
                # Add ingredients to ingredient table
                db.execute("INSERT INTO ingredient (name) VALUES (:name)", name=request.form.get("ingredient" + str(i)))
                # Now get the primary key of newly added ingredient
                ingredientKey = db.execute("SELECT id FROM ingredient WHERE name = :ingredientName",
                ingredientName=request.form.get("ingredient" + str(i)))
                # Finally add to the list
                ingredientIDs.append(ingredientKey[0]["id"])
            else:
                ingredientIDs.append(ingredientAdd)

            if measureAdd == 0:
                # Add meaures to measure table
                db.execute("INSERT INTO measure (name) VALUES (:name)", name=request.form.get("measure" + str(i)))
                # Get primary key of newly added measure
                measureKey = db.execute("SELECT id FROM measure WHERE name = :measureName",
                measureName=request.form.get("measure" + str(i)))
                # Add key to list
                measureIDs.append(measureKey[0]["id"])
            else:
                measureIDs.append(measureAdd)

            #Now save remaining ingredients, measures, and amounts to the recipe_ingredients table using the ingredient and measure primary keys
            db.execute("INSERT INTO recipe_ingredient (recipe_id, ingredient_id, measure_id, amount) VALUES (:key, :ingredient, :measure, :amount)",
            key=recipeKey[0]["MAX(id)"], ingredient=ingredientIDs[i - 1], measure=measureIDs[i - 1],amount=request.form.get("amount" + str(i)))
            i += 1

        flash("You've successfully added your recipe! It will now appear in your list of recipes below and be searchable to other users.", 'success')
        return redirect("/")

    else:
        # Get list of measurements for dropdown list
        measureList = db.execute("SELECT DISTINCT(name) FROM measure")

        return render_template("new.html", measureList=measureList)

@app.route("/check", methods=["GET", "POST"])
def check():
    """Return true if username available, else false, in JSON format"""
    if request.method == "POST":
        # Use the user input provided from the AJAX call to query the DB as soon as the user clicks off the textbox

        if request.form.get("username").isalnum():
            name = db.execute("SELECT username FROM users WHERE username = :username", username=request.form.get("username"))
            # If no rows are returned then the user name is available
            if not name:
                # Return value to AJAX call to determine if username is available before submitting register form
                return jsonify(True)
            else:
                return jsonify(False)
        else:
            return jsonify(False)

@app.route("/autocomplete", methods=["GET"])
def autocomplete():
    search = request.args.get('q')
    query = db.execute("SELECT name, id FROM ingredient WHERE name like :name", name='%' + search + '%')
    results = []
    for ingredient in query:
        results.append(query[0]['name'])
    return jsonify(matching_results=results)

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            # Find last char of file name before file extension
            index = file.filename.rfind('.')
            # Add datetime info to file name to avoid duplicate file uploads
            file.filename = file.filename[:index] + datetime.now().strftime("%m%d%y%I%M%S") + file.filename[index:]

            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return json.dumps({'filename':filename})

@app.route("/edit/uploadEdit/<int:recipe_id>", methods=['POST'])
def uploadEdit(recipe_id):
    if request.method == 'POST':
        file = request.files['file']
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            # Find last char of file name before file extension
            index = file.filename.rfind('.')
            # Add datetime info to file name to avoid duplicate file uploads
            file.filename = file.filename[:index] + datetime.now().strftime("%m%d%y%I%M%S") + file.filename[index:]

            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            # Now update the DB since we aren't submitting a form like on new recipe submission
            db.execute("UPDATE recipe SET img_file_path = :filename WHERE id = :recipeID", filename=filename, recipeID=recipe_id)

    return json.dumps({'filename':filename})

####################################################################################################
# Helpers section - Moved from helpers.py due to confiction with werkzeug framework and db assignment
#####################################################################################################
def ingredientExists(ingredient):
    ingredientID = db.execute("SELECT id FROM ingredient WHERE name = :name", name=ingredient)

    if not ingredientID:
        print("Ingredient Doesn't Exist")
        return 0
    else:
        return ingredientID[0]['id']

def measureExists(measure):
    measureID = db.execute("SELECT id FROM measure WHERE name = :name", name=measure)

    if not measureID:
        print("Measure Doesn't Exist")
        return 0
    else:
        return measureID[0]['id']

def updateRecipe(recipe_id, field, update):
    try:
        db.execute("UPDATE recipe SET " + field + " = :update WHERE id = :recipeID", update=update, recipeID=recipe_id)
        if field == "description":
            field = "author"

        return ("The " + field + " of your recipe has been updated!")
    except:
        return ("There was a problem updating the " + field + " of your recipe.")

def updateIngredients(recipe_id, ingredientUpdate, ingredient_id, amountUpdate, measureUpdate, measure_id):
    try:
        # Check to see if ingredient and measure already exist in their tables
        existingIngredient = db.execute("SELECT id FROM ingredient WHERE name = :ingredientUpdate", ingredientUpdate=ingredientUpdate)
        existingMeasure = db.execute("SELECT id FROM measure WHERE name = :measureUpdate", measureUpdate=measureUpdate)

        # If NOT add the new ingredient to the ingredient table
        if not existingIngredient:
            # Insert new ingredient to the table
            db.execute("INSERT INTO ingredient (name) VALUES (:name)", name=ingredientUpdate)
            # Get new ingredient key
            ingredientKey = db.execute("SELECT id FROM ingredient WHERE name = :ingredientName", ingredientName=ingredientUpdate)

            newIngredientID = ingredientKey[0]['id']
        else:
            # Ingredient exists so assign it the id from the initial query
            newIngredientID = existingIngredient[0]['id']

        # Check to see if measure already exists in the measure table
        if not existingMeasure:
            # Insert new ingredient to the table
            db.execute("INSERT INTO measure (name) VALUES (:name)", name=measureUpdate)
            # Get new ingredient key
            measureKey = db.execute("SELECT id FROM measure WHERE name = :measureName", measureName=measureUpdate)

            newMeasureID = measureKey[0]['id']
        else:
            # Ingredient exists so assign it the id from the initial query
            newMeasureID = existingMeasure[0]['id']

        # Update recipe_ingredient table with new ingredient id, measure id, and amount
        db.execute("UPDATE recipe_ingredient SET ingredient_id = :NewIngredientID, measure_id = :NewMeasureID, amount = :amountUpdate \
                    WHERE recipe_id = :recipeID AND ingredient_id = :OldIngredientID and measure_id = :OldMeasureID",
                    NewIngredientID=newIngredientID, NewMeasureID=newMeasureID, amountUpdate=amountUpdate, recipeID=recipe_id,
                    OldIngredientID=ingredient_id, OldMeasureID=measure_id)

        return ("The ingredient in your recipe has been updated!")
    except:
        return ("There was a problem updating the ingredient in your recipe.")

def addNewIngredients(request, recipeID):
    try:
        # Hidden field input to determine number of ingredient fields
        ingredients = int(request.form.get("numIngredients"))
        i = 1
        # List of ingredient and measure primary ID keys. Needed to insert the final recipe into recipe ingredients
        ingredientIDs = []
        measureIDs = []

        while ingredients >= i:
            # Check if ingredient and measure already exist in the DB
            ingredientAdd = ingredientExists(request.form.get("ingredient" + str(i)))
            measureAdd = measureExists(request.form.get("measure" + str(i)))

            # Ingredient does not exist if return = 0
            if ingredientAdd == 0:
                # Add ingredients to ingredient table
                db.execute("INSERT INTO ingredient (name) VALUES (:name)", name=request.form.get("ingredient" + str(i)))
                # Now get the primary key of newly added ingredient
                ingredientKey = db.execute("SELECT id FROM ingredient WHERE name = :ingredientName",
                ingredientName=request.form.get("ingredient" + str(i)))
                # Finally add to the list
                ingredientIDs.append(ingredientKey[0]["id"])
            else:
                ingredientIDs.append(ingredientAdd)

            if measureAdd == 0:
                # Add meaures to measure table
                db.execute("INSERT INTO measure (name) VALUES (:name)", name=request.form.get("measure" + str(i)))
                # Get primary key of newly added measure
                measureKey = db.execute("SELECT id FROM measure WHERE name = :measureName",
                measureName=request.form.get("measure" + str(i)))
                # Add key to list
                measureIDs.append(measureKey[0]["id"])
            else:
                measureIDs.append(measureAdd)

            #Now save remaining ingredients, measures, and amounts to the recipe_ingredients table using the ingredient and measure primary keys
            db.execute("INSERT INTO recipe_ingredient (recipe_id, ingredient_id, measure_id, amount) VALUES (:key, :ingredient, :measure, :amount)",
            key=recipeID, ingredient=ingredientIDs[i - 1], measure=measureIDs[i - 1],amount=request.form.get("amount" + str(i)))
            i += 1

        return True

    except:
        print(sys.exc_info()[0])
        return False

def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)