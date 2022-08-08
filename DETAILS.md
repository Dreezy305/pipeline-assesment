## HOW DOES THIS WORK

This project is a simple backend api service built with express (node js frame work)

The api is hosted with heroku cloud services

base url (https://piple-project.herokuapp.com/) can be found in the properties.json file along side other relevant information

the api https://piple-project.herokuapp.com/howOld/:dob takes a query parameter of date of birth

the date of birth is usually in this format (YYYY-MM-DD),

then the api performs an operation and returns the correct age (in years) till date

if the date of birth supplied is not in line with the format stated in line 11, then a status code of 400, and an error message ("There was an error, pls enter the correct format(YYYY-MM-DD)") will be returned

if the date of birth is in correct format, a status code of 200, success message ("Age calculated successfully") and the calculated age will be returned.
