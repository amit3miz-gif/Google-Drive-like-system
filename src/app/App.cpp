#include "App.h"

App::App(IParser& parser, std::map<std::string, ICommand*> commands,IOutput& output)
    : parser_(parser), commands_(std::move(commands)), output_(output) {}

// Destructor: clean up allocated ICommand objects
App::~App() {
    for (auto& kv : commands_) {
        delete kv.second;
    }
}

// Map internal status codes + body to the text protocol.
void App::writeResponse(const CommandResult& result) {
    switch (result.statusCode) {
    case 201:
        // POST succeeded: new file created
        output_.writeLine("201 Created");
        break;

    case 204:
        // DELETE succeeded: file removed
        output_.writeLine("204 No Content");
        break;

    case 200:
        // command succeeded: may have body
        output_.writeLine("200 Ok");
        output_.writeLine("");
        if (!result.body.empty()) {
            output_.writeLine(result.body);
        }
        output_.writeLine("");
        break;


    case 404:
        // Logically invalid but structurally valid command
        output_.writeLine("404 Not Found");
        break;
    
    case 500:
        // The request was valid, but an unexpected server-side error occurred.
        output_.writeLine("500 Internal Server Error");
        break;

    default:
        // Any other status code is treated as a bad request
        output_.writeLine("400 Bad Request");
        break;
    }
}

void App::run() {
    while (true) {
        // Parse the next command line from input
        auto cmdPair = parser_.nextCommand();
        const std::string& cmdName = cmdPair.first;
        const std::string& cmdArgs = cmdPair.second;

        // EOF received - end the session
        if (cmdName == "_EOF_") {
            break;
        }

        // No valid command name parsed - structurally invalid command.
        if (cmdName.empty()) {
            output_.writeLine("400 Bad Request");
            continue;
        }

        // Look up the command by its name.
        auto it = commands_.find(cmdName);
        if (it == commands_.end()) {
            // Command name is unknown
            output_.writeLine("400 Bad Request");
            continue;
        }

        //Registered command: set its arguments and execute
        ICommand* command = it->second;
        command->setArgs(cmdArgs);
        CommandResult result = command->execute();

        // Translate the CommandResult to the exact protocol response.
        writeResponse(result);
    }
}
