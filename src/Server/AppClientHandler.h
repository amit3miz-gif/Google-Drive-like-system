#ifndef APPCLIENTHANDLER_H
#define APPCLIENTHANDLER_H

#include "IClientHandler.h"
#include "app/App.h"
#include "parser/IParser.h"
#include "io/IInput.h"
#include "io/IOutput.h"
#include "menu/IMenu.h"
#include "commands/ICommand.h"
#include <map>
#include <string>

// IClientHandler implementation that wires a single client session
// into the application flow.
// For each client, it builds the parser and commands map on top of the
// provided input/output abstractions and then runs the App loop.
class AppClientHandler : public IClientHandler {
private:
    IMenu& menu_; // shared menu used to create commands for each client

public:
    // Receives a shared menu used to create commands map per client
    explicit AppClientHandler(IMenu& menu);
    void handleClient(IInput& in, IOutput& out) override;
};

#endif