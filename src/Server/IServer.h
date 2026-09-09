#ifndef ISERVER_H
#define ISERVER_H

// Interface for a generic server.
class IServer {
public:
    virtual ~IServer() = default;
    // Starts the server and begins handling incoming connections
    virtual void start() = 0;
};

#endif