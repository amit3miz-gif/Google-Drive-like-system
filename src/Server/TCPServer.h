#ifndef TCPSERVER_H
#define TCPSERVER_H

#include "IServer.h"
#include "IClientHandler.h"
#include "ThreadPool.h"

// TCP implementation of the IServer interface.
// Listens on a given port and delegates each client connection
// to an IClientHandler instance.
class TCPServer : public IServer {
private:
    // TCP port number the server will listen on
    int port;
    // Handler responsible for processing a single client session
    IClientHandler& handler;
    // Fixed-size thread pool
    ThreadPool _pool;

public:
    TCPServer(int port, IClientHandler& handler, size_t numThreads);
    void start() override;
};

#endif