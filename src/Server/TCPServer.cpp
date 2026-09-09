#include "Server/TCPServer.h"
#include "io/SocketTCPInput.h"
#include "io/SocketTCPOutput.h"

#include <stdexcept>
#include <thread>
#include <vector>

#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

TCPServer::TCPServer(int port, IClientHandler& handler, size_t numThreads)
    : port(port), handler(handler), _pool(numThreads) {}


void TCPServer::start() {
    // Create listening socket
    int listenSock = socket(AF_INET, SOCK_STREAM, 0);
    if (listenSock < 0) {
        return;
    }

    // Allow quick reuse of the address.
    int opt = 1;
    setsockopt(listenSock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in serverAddr{};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(port);

    if (bind(listenSock, (struct sockaddr *)&serverAddr, sizeof(serverAddr)) < 0) {
        close(listenSock);
        return;
    }

    if (listen(listenSock, SOMAXCONN) < 0) {
        close(listenSock);
        return;
    }

    // Main accept loop: submit each client to the thread pool
    while (true) {
        struct sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);
        int clientSock = accept(listenSock,
                                (struct sockaddr *)&clientAddr,
                                &clientLen);
        if (clientSock < 0) {
            continue;
        }

        // Submit a job to handle this client using the thread pool
        _pool.submit([this, clientSock]() {
            SocketTCPInput in(clientSock);
            SocketTCPOutput out(clientSock);

            // Delegate session to the handler
            handler.handleClient(in, out);

            // When done, close the client socket
            close(clientSock);
        });
    }

    close(listenSock);
}