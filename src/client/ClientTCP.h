#ifndef CLIENT_TCP_H
#define CLIENT_TCP_H

#include "IClient.h"
#include <string>
#include "io/StdoutOutput.h"

// TCP client that maintains a persistent connection to the server,
// sends user commands exactly as typed, and prints all server responses
class ClientTCP : public IClient {

    public:
    ClientTCP(const std::string& serverIp, int serverPort);
    ~ClientTCP() override;
    bool run() override;

    private:
        bool connectToServer();
        bool sendLine(const std::string& line);
        bool readLine(std::string& outLine);

        std::string m_serverIp;
        int m_serverPort;
        int m_sock; // -1 = not open
        StdoutOutput m_output;
        
        // non-copyable
        ClientTCP(const ClientTCP&) = delete;
        ClientTCP& operator=(const ClientTCP&) = delete;
    };

#endif
