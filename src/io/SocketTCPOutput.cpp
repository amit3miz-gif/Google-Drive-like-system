#include "io/SocketTCPOutput.h"

#include <sys/socket.h>
#include <unistd.h>
#include <errno.h>

SocketTCPOutput::SocketTCPOutput(int socketFd)
    : m_socketFd(socketFd)
{
}


void SocketTCPOutput::writeLine(const std::string& line) {
    if (m_socketFd < 0) {
        // Socket already closed – nothing to do
        return;
    }

    // We always send a newline at the end, like StdoutOutput.
    std::string data = line;
    data.push_back('\n');

    std::size_t totalSent = 0; // total bytes sent so far
    const std::size_t toSend = data.size();

    while (totalSent < toSend) {
        ssize_t n = ::send(
            m_socketFd,
            data.data() + totalSent,
            toSend - totalSent,
            0
        );

        if (n > 0) {
            totalSent += static_cast<std::size_t>(n);
            continue;
        }

        if (n < 0 && errno == EINTR) {
            // Interrupted by signal – retry.
            continue;
        }

        // other error – stop trying
        break;
    }
}
