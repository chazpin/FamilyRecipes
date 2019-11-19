import sys
import requests
import urllib.parse

from flask import redirect, render_template, request, session
from functools import wraps
#from cs50 import SQL

# Setting this in multiple places (application.py and also helper.py) causes werkzeug to get confused
#db = SQL("sqlite:///recipe.db")
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])

def login_required(f):
    """
    Decorate routes to require login.

    http://flask.pocoo.org/docs/1.0/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            print("DID NOT GET SESSION ID")
            return redirect("/login")
        else:
            print(session.get("user_id"))
        return f(*args, **kwargs)
    return decorated_function


def apology(message, code=400):
    """Render message as an apology to user."""
    def escape(s):
        """
        Escape special characters.

        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [("-", "--"), (" ", "-"), ("_", "__"), ("?", "~q"),
                         ("%", "~p"), ("#", "~h"), ("/", "~s"), ("\"", "''")]:
            s = s.replace(old, new)
        return s
    return render_template("apology.html", top=code, bottom=message), code

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS