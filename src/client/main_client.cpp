
#include "ClientTCP.h"
#include <string>
#include <cstdlib>

// Main entry for the client. Initializes a TCP client using command-line
// arguments and runs it to process user commands and server responses.
int main(int argc, char* argv[])
{
    if (argc != 3) {
        return 1;
    }

    std::string ip   = argv[1];
    int port = std::atoi(argv[2]);

    ClientTCP client(ip, port);

    // client loop - user input, send, receive response, print
    if (!client.run()) {
        return 1;
    }
    return 0;
}
