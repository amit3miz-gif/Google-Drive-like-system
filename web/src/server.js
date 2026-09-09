// Entry point of the web server application
// Responsible for connecting to DB, and starting the HTTP server

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGOURI;

// Connect to MongoDB and start the server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to Mongo");

    // start listening for incoming HTTP requests
    app.listen(PORT, () => {
      console.log(`Web server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error", err);
    process.exit(1); // Exit the process with failure
  });
