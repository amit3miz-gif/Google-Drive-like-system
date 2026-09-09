#ifndef ICLIENT_H
#define ICLIENT_H

// Interface for client classes that implement a run method responsible for
// executing the entire client workflow, whatever the underlying protocol may be.
// Concrete client types must implement this behavior.

class IClient {
public:
    virtual ~IClient() = default;
    virtual bool run() = 0;
};

#endif
