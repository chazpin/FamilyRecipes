#Family Recipes

Family Recipes is a python web application that allows users to create, edit, share, and search a database of recipes. Additionally, family made hard copy recipe
books are available to browse as digital copies.

##Background

This application was initially intended to provide members of my family easy access to recipes in a recipe book my wife and I had made for my sister as a wedding gift.
Many of the family wanted their own hard copy of the book we created, but my wife and I wanted my sister's copy to be a special gift and did not want to re-create it
for others. As such, I thought why not put a digital copy of the book online for all to access at anytime. Additionally, I thought it would be neat for anyone browsing
the digital recpie book to have the ability to add their own recpies and search for new ones others have added. And that's where the idea for Family Recpies began. An
online recpie service is not by any means a novel idea, but I like that this particular app will be centered around one specific family and the recpies they've shared
and loved over generations.

##Features

Users are required to register with a valid email address and secure password. An email is sent upon registration to the email address provided at registration that
contains a link for users to follow to validate their email and activate their account. Once a user is registered they will be directed to their dashboard which will
display a list of the 5 most recently added recipes and a list of all the recipes they have added. From the navigation bar atop the page they will also have access to
browse digital copy(s) of family made recipe books, add new recpies, and search the entire database of recipes using several filters to assist. Through the use of the
BookReader.js library the digital cookbook can be flipped through with a simple click of the page or skipped to a specific page using the navigation bar at the page
bottom. There are also several display options including a thumbnail view.

Also from the navigation bar, users can add a new recpie to the database. Family Recipes allows the user to include a recpie name, author, a list of instructions, and
ingredients along with the amount and measure of each. A record of commonly used measures is kept and presented to the user in a dropdown list for ease of entry. The
user also has the ability to upload a photo of their choice to the recipe. Multiple photo upload is marked for future development. Users also can edit recpies, but only
those that they have added.

Lastly, a search function is provided that allows users to search the entire recpie database by recipe, author, user, ingredient, or all fields. The 'All' search option
will display a list of results broken down into each specific category that return a result from the query.

##Future Development

At some point in the future I would like to add 'forgot password' and 'send new activation key' functionality. I'd also like to implement the ability to add more than
one photo to a recipe and also track the last user and time of edits made.

##Acknowledgment

Thanks to the BookReader and LightBox js libraries that greatly helped with the display of image content to the user in this project. And of course, the CS50 team that
taught such an amazing and informative course. Hands down best course I've ever had the pleasure of taking!



