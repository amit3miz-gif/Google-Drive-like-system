#ifndef ICLIENTHANDLER_H
#define ICLIENTHANDLER_H

#include "io/IInput.h"
#include "io/IOutput.h"

// Interface for handling a single client session.
class IClientHandler {
public:
    virtual ~IClientHandler() = default;
    virtual void handleClient(IInput& in, IOutput& out) = 0;
};

#endif