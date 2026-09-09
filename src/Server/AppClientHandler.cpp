#include "Server/AppClientHandler.h"
#include "parser/ConsoleParser.h"

// Constructor: store reference to shared menu used to build commands per client.
AppClientHandler::AppClientHandler(IMenu& menu)
: menu_(menu) {}

// Handle a single client session using the given input and output.
void AppClientHandler::handleClient(IInput& in, IOutput& out) {
    // Parser that reads commands from this client's input.
    ConsoleParser parser(in);
    // Build commands map for this client session.
    std::map<std::string, ICommand*> commands = menu_.createCommands();    // Run the application loop for this client.
    App app(parser, std::move(commands), out);
    app.run();
}