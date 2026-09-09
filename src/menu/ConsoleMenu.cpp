#include "ConsoleMenu.h"

ConsoleMenu::ConsoleMenu(IFileRepository& repo, ICompressor& compressor)
    : repo(repo), compressor(compressor) {}

// Creates all available commands and returns them in a map keyed by name
std::map<std::string, ICommand*> ConsoleMenu::createCommands() {
    // Create concrete command objects
    ICommand* addCmd = new AddCommand(repo, compressor); // POST command
    ICommand* getCmd = new GetCommand(repo, compressor);
    ICommand* searchCmd = new SearchCommand(repo, compressor);
    ICommand* deleteCmd  = new DeleteCommand(repo);

    // Register commands in a map 
    std::map<std::string, ICommand*> commands;
    commands[addCmd->name()] = addCmd; // POST
    commands[getCmd->name()] = getCmd;
    commands[searchCmd->name()] = searchCmd;
    commands[deleteCmd->name()] = deleteCmd;
    return commands;
}
