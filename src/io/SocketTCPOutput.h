#ifndef SOCKET_TCP_OUTPUT_H
#define SOCKET_TCP_OUTPUT_H

#include "io/IOutput.h"

#include <string>

// implementation of IOutput that writes to a TCP socket
class SocketTCPOutput : public IOutput {
public:
    
    explicit SocketTCPOutput(int socketFd);// user must close socketFd.
    void writeLine(const std::string& line) override;

private:
    int m_socketFd;  // Connected TCP socket file descriptor

    // Non-copyable
    SocketTCPOutput(const SocketTCPOutput&) = delete;
    SocketTCPOutput& operator=(const SocketTCPOutput&) = delete;
};

#endif
