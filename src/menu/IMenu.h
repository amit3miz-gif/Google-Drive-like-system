#ifndef IMenu_H
#define IMenu_H

#include <map>
#include <string>
#include "commands/ICommand.h"

// IMenu represents an interface for building the application's command menu.
// It is responsible for creating commands and exposing them
// via a mapping from command name to ICommand.
class IMenu {
public:
    virtual ~IMenu() = default;
    // Returns a mapping from command name to the corresponding ICommand.
    virtual std::map<std::string, ICommand*> createCommands() = 0;
};

#endif