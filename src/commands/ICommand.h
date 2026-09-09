#ifndef ICOMMAND_H
#define ICOMMAND_H

#include "CommandResult.h"

#include <string>

// Interface for commands in the CLI system
class ICommand {
public:
    virtual ~ICommand() = default;

    // Returns the name of the command
    virtual std::string name() const = 0;

    // Executes the command and returns the result
    virtual CommandResult execute() = 0;

    // Sets the arguments string passed to the command
    virtual void setArgs(const std::string& args) 
    { 
      (void)args; // suppress unused parameter warning
    }
};

#endif 
