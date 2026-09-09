#include "io/SocketTCPInput.h"
#include <sys/socket.h>
#include <unistd.h>
#include <errno.h>

SocketTCPInput::SocketTCPInput(int socketFd)
    : m_socketFd(socketFd), m_buffer(), m_eof(false) {}


std::string SocketTCPInput::readLine() {
    // if there is already a '\n' in the buffer – return it directly
    // endless loop
    for (;;) { 
        std::size_t pos = m_buffer.find('\n');
        if (pos != std::string::npos) {
            std::string line = m_buffer.substr(0, pos);
            m_buffer.erase(0, pos + 1);  // leave the rest in the buffer
            return line;
        }

        // no '\n' – need to read more from the socket
        char buf[1024];
        ssize_t n = ::recv(m_socketFd, buf, sizeof(buf), 0);

        if (n > 0) {
            // add received data to the buffer
            m_buffer.append(buf, static_cast<std::size_t>(n));
            continue;
        }

        if (n == 0) {
            // the other side closed the connection
            m_eof = true;
            std::string line = m_buffer;
            m_buffer.clear();
            return line;
        }

        // n < 0 – error
        if (errno == EINTR) {
            // interrupted – try again
            continue;
        }

        // other error – return what we have / empty
        m_eof = true;
        std::string line = m_buffer;
        m_buffer.clear();
        return line;
    }
}
