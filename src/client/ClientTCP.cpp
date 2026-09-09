#include "ClientTCP.h"
#include <cstring>
#include <cerrno>
#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>


ClientTCP::ClientTCP(const std::string& serverIp, int serverPort)
    : m_serverIp(serverIp), m_serverPort(serverPort), m_sock(-1) {
}

// Destructor - close the socket if open
ClientTCP::~ClientTCP() {
    if (m_sock >= 0) {
        ::close(m_sock);
        m_sock = -1;
    }
}

// establish a TCP connection to the server.
bool ClientTCP::connectToServer() {
    m_sock = ::socket(AF_INET, SOCK_STREAM, 0);
    if (m_sock < 0) {
        return false;
    }

  // Support both IP (e.g. "127.0.0.1") and hostname (e.g. "server")
    struct addrinfo hints;
    std::memset(&hints, 0, sizeof(hints));
    hints.ai_family   = AF_INET;
    hints.ai_socktype = SOCK_STREAM;

    struct addrinfo* res = nullptr;
    const std::string portStr = std::to_string(m_serverPort);
    int rc = ::getaddrinfo(m_serverIp.c_str(), portStr.c_str(), &hints, &res);
    if (rc != 0 || !res) {
        ::close(m_sock);
        m_sock = -1;
        return false;
    }

    bool ok = false;
    for (struct addrinfo* p = res; p != nullptr; p = p->ai_next) {
        if (::connect(m_sock, p->ai_addr, p->ai_addrlen) == 0) {
            ok = true;
            break;
        }
    }
    ::freeaddrinfo(res); // free the addrinfo list

    if (!ok) {
        ::close(m_sock);
        m_sock = -1;
        return false;
    }

    return true;
}

// send one line to the socket (without the trailing '\n')
bool ClientTCP::sendLine(const std::string& line) {
    if (m_sock < 0) {
        return false;
    }

    // send the line plus '\n'
    std::string data = line; 
    data.push_back('\n');

    std::size_t total = 0;
    while (total < data.size()) {
        ssize_t n = ::send(m_sock, data.data() + total,
                           data.size() - total, 0);
        if (n > 0) {
            total += static_cast<std::size_t>(n);
            continue;
        }
        if (n < 0 && errno == EINTR) {
            continue; // interrupted, retry
        }
        return false; // other error
    }
    return true;
}

// read one line from the socket (without the trailing '\n')
bool ClientTCP::readLine(std::string& outLine) {
    if (m_sock < 0) {
        return false;
    }

    outLine.clear();
    char ch;
    while (true) {
        ssize_t n = ::recv(m_sock, &ch, 1, 0);
        if (n > 0) {
            if (ch == '\n') {
                // full line (without '\n')
                return true;
            }
            outLine.push_back(ch);
            continue;
        }
        if (n == 0) {
            // server closed the connection
            return !outLine.empty(); // true if we have a partial line
        }
        if (errno == EINTR) {
            continue; // retry
        }
        return false;
    }
}

// main client loop
bool ClientTCP::run() {

    if (!connectToServer()) {
        return false;
    }

    std::string command;
    while (true) {

        // read one command line from console (blocking)
        if (!std::getline(std::cin, command)) {
            // EOF on stdin - exit client
            return true;
        }

        if (!sendLine(command)) {
            return false;
        }

        std::string status;
        if (!readLine(status)) {
            return false;
        }

        m_output.writeLine(status); // always print the status line

        // if it's a 200 response - there may be a multi-line body
        if (status.rfind("200 ", 0) == 0) {
            std::string line;
            
            m_output.writeLine("");

            // read the line after the status (should be empty)
            if (!readLine(line)) {
                return false;
            }
            

            while (true) {
                if (!readLine(line)) {
                    return false; // closed mid-body
                }

                if (line.empty()) {
                    break; // end of body
                }
                m_output.writeLine(line);
                }
      

        }
    }

    return true;
}
