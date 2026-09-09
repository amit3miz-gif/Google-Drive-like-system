#include "Server/TCPServer.h"
#include "Server/AppClientHandler.h"
#include "storage/FileStorageRepository.h"
#include "compression/RLECompressor.h"
#include "menu/ConsoleMenu.h"
#include "io/SocketTCPInput.h"
#include "io/SocketTCPOutput.h"
#include <string>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        return 1;
    }
    int port;
    try {
        port = std::stoi(argv[1]);
    } catch (...) {
        return 1;
    }
    
    // Get storage path
    const char* filesDir = std::getenv("FILES_DIR");
    
    // Get thread pool size (default to 4 if not set or invalid)
    size_t numThreads = 4;
    if (const char* envThreads = std::getenv("SERVER_THREADS")) {
        try {
            numThreads = static_cast<size_t>(std::stoul(envThreads));
        } catch (...) {
            // keep default
        }
    }


    // Shared services
    FileStorageRepository repo(filesDir);
    RLECompressor compressor;

    // Shared menu (builds commands using the shared services)
    ConsoleMenu menu(repo, compressor);

    // Client handler that will use the shared menu for each client session
    AppClientHandler handler(menu);

    // TCP server that accepts clients and delegates them to the handler
    TCPServer server(port, handler, numThreads);
    server.start();

    return 0;
}
