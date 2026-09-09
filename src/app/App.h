#ifndef APP_H
#define APP_H

#include <map>
#include <string>
#include "parser/IParser.h"
#include "commands/ICommand.h"
#include "commands/CommandResult.h"
#include "io/IOutput.h"

// Main application class that:
// - Reads commands from IParser
// - Dispatches them to ICommand objects
// - Translates CommandResult into protocol text over IOutput
class App {
private:
    IParser& parser_;  // Parses raw input into (command, args)
    std::map<std::string, ICommand*> commands_;  // Registered commands by name
    IOutput& output_;   // Output channel to the client
    void writeResponse(const CommandResult& result); // Translates a CommandResult into the exact protocol response lines

public:
    App(IParser& parser,
        std::map<std::string, ICommand*> commands,
        IOutput& output);

    ~App();  // Default destructor

    App(const App&) = delete;
    App& operator=(const App&) = delete;
    App(App&&) = delete;
    App& operator=(App&&) = delete;

    void run(); // Main loop: read, dispatch, respond.
};


#endif