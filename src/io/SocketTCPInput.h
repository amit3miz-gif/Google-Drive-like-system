#ifndef SOCKET_TCP_INPUT_H
#define SOCKET_TCP_INPUT_H

#include "io/IInput.h"
#include <string>


// implementation of IInput that reads from a TCP socket
class SocketTCPInput : public IInput {
public:
    explicit SocketTCPInput(int socketFd);
    std::string readLine() override;
    bool isEof() const override { return m_eof; }

private:
    int m_socketFd;
    std::string m_buffer;  // buffer to hold leftover data between reads
    bool m_eof;
    
    // Non-copyable
    SocketTCPInput(const SocketTCPInput&) = delete;
    SocketTCPInput& operator=(const SocketTCPInput&) = delete;
};


#endif
