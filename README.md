# README #

### What is this repository for? ###

* This respository is for a project named as Online Battle Ground. Users can choose any game available for different platforms like PC, Xbox, Ps etc. They can join any tournament or they can create a tournament or ladder themselves. I am working on the back end of this project using node.js where I design the database using mongoDb.

* Nodejs version : 15.11.0
  MongoDb version : 4.4
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Download Node js using the link provided https://nodejs.org/en/download/. Once the download is complete, click the installer and complete the installation and run node js. After completing the installation, verify the installation using cmd and run the command node -v to see the version of your node.
You will be required to install mongoDb Compass as well for database designing and connect the database with your system.
* Configuration: 
          you can setup default configuration using the following commands 
           npm set init.author.email "example-user@example.com"
           npm set init.author.name "example_user"
           npm set init.license "MIT"
* Dependencies:
            you are required to install following dependencies to make sure your code runs perfectly.
            npm install -g npm-check
            npm-check

* Database configuration:
            install mongodb in node using the command npm install mongodb, create a free cluster account on mondodb atlas and click the connect button.
            Import the mongodb using the command const {MongoClient} = require('mongodb'); in mongodb.
            Connect the database using the following code in node js
            mongoose.connect(dbUrl, {useNewUrlParser: true,  useCreateIndex: true }, (err) => {
    if(!err){
        console.log('Connection Successful');
    } else
    {
        console.log('Connection not successful', err);
    }
});
mongoose.Promise = global.Promise;

* Deployment instructions:
          npm install git 
          npm start
          or
          node filename.js


