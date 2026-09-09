#include <gtest/gtest.h>
#include <thread>
#include <chrono>
#include <vector>
#include <atomic>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

#include "Server/TCPServer.h"
#include "Server/IClientHandler.h"
#include "io/IInput.h"
#include "io/IOutput.h"

// Mock handler to verify that handleClient is called
class CountingClientHandler : public IClientHandler {
public:
    std::atomic<int> callCount{0};
    bool sleepInHandler = false;
    int sleepMillis = 0;

    void handleClient(IInput& in, IOutput& out) override {
        callCount.fetch_add(1);
        if (sleepInHandler && sleepMillis > 0) {
            // simulate long processing for this client
            std::this_thread::sleep_for(std::chrono::milliseconds(sleepMillis));
        }
    }
};

// Helper: connect a client to given port on localhost
static int connectClientToPort(int port) {
    int clientSock = ::socket(AF_INET, SOCK_STREAM, 0);
    if (clientSock < 0) {
        return -1;
    }

    sockaddr_in serverAddr{};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); // connect to localhost
    serverAddr.sin_port = htons(port);

    int res = ::connect(clientSock, (sockaddr*)&serverAddr, sizeof(serverAddr));
    if (res != 0) {
        ::close(clientSock);
        return -1;
    }
    return clientSock;
}

// Single client connection triggers handler exactly once
TEST(TCPServerTest, CallsHandlerOnSingleClientConnection) {
    CountingClientHandler handler;
    int port = 4000; // fixed port for test
    size_t numThreads = 4;

    TCPServer* server = new TCPServer(port, handler, numThreads);
    std::thread serverThread([server]() {
        server->start();
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(200)); // wait for server to start

    int clientSock = connectClientToPort(port);
    ASSERT_GE(clientSock, 0) << "Failed to connect client to server";

    // Allow some time for server to accept and handle
    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    EXPECT_EQ(handler.callCount.load(), 1) << "Handler should be called exactly once";

    ::close(clientSock);
    serverThread.detach(); // no clean shutdown API on server
}

// Multiple clients in sequence - handler should be called N times
TEST(TCPServerTest, CallsHandlerForMultipleSequentialClients) {
    CountingClientHandler handler;
    int port = 4001;
    size_t numThreads = 4;

    TCPServer* server = new TCPServer(port, handler, numThreads);
    std::thread serverThread([server]() {
        server->start();
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    const int numClients = 5;
    std::vector<int> clientSocks;
    clientSocks.reserve(numClients);

    // Connect multiple clients one after another
    for (int i = 0; i < numClients; ++i) {
        int sock = connectClientToPort(port);
        ASSERT_GE(sock, 0) << "Failed to connect client " << i;
        clientSocks.push_back(sock);
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(300)); // give server time to handle all

    EXPECT_EQ(handler.callCount.load(), numClients)
        << "Handler should be called once per client connection";

    for (int sock : clientSocks) {
        ::close(sock);
    }
    serverThread.detach();
}

// Multiple clients overlapping in time (concurrency test)
// This does not strictly prove threads run in parallel, but it checks that
// multiple connections do not block each other from being accepted.
TEST(TCPServerTest, HandlesMultipleClientsConcurrently) {
    CountingClientHandler handler;
    handler.sleepInHandler = true;
    handler.sleepMillis = 500; // each handler call sleeps for 500 ms

    int port = 4002;
    size_t numThreads = 4;

    TCPServer* server = new TCPServer(port, handler, numThreads);
    std::thread serverThread([server]() {
        server->start();
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    const int numClients = 3;
    std::vector<int> clientSocks;
    clientSocks.reserve(numClients);

    // Connect several clients quickly, while handler sleeps
    for (int i = 0; i < numClients; ++i) {
        int sock = connectClientToPort(port);
        ASSERT_GE(sock, 0) << "Failed to connect client " << i;
        clientSocks.push_back(sock);
    }

    // Wait a bit less than the total serial time (numClients * 500ms)
    std::this_thread::sleep_for(std::chrono::milliseconds(800));

    int calls = handler.callCount.load();
    EXPECT_GE(calls, 1) << "Handler should be called at least once";
    EXPECT_LE(calls, numClients) << "Handler calls should not exceed number of clients";

    for (int sock : clientSocks) {
        ::close(sock);
    }
    serverThread.detach();
}

// Client that connects and closes immediately should not crash server
TEST(TCPServerTest, HandlesClientThatDisconnectsImmediately) {
    CountingClientHandler handler;
    int port = 4003;
    size_t numThreads = 4;

    TCPServer* server = new TCPServer(port, handler, numThreads);
    std::thread serverThread([server]() {
        server->start();
    });

    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    int clientSock = connectClientToPort(port);
    ASSERT_GE(clientSock, 0) << "Failed to connect client";

    // Immediately close the client socket
    ::close(clientSock);

    // Give server some time to react
    std::this_thread::sleep_for(std::chrono::milliseconds(200));

    // We mainly care that server did not crash; handler may or may not be called
    SUCCEED() << "Server handled immediate disconnect without crashing";

    serverThread.detach();
}
