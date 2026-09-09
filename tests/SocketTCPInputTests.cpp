#include <gtest/gtest.h>
#include "io/SocketTCPInput.h"

#include <sys/socket.h>
#include <unistd.h>

// Helper: Creates a pair of local connected sockets (no real network)
static void createSocketPair(int fds[2])
{
    int res = ::socketpair(AF_UNIX, SOCK_STREAM, 0, fds);
    ASSERT_EQ(res, 0) << "socketpair failed";
}

// Basic reading of a single line
TEST(SocketTCPInputTest, ReadSingleLine)
{
    int fds[2];
    createSocketPair(fds);

    SocketTCPInput input(fds[0]); // the "input" side of the application
    const char* msg = "hello world\n"; 
    ::send(fds[1], msg, strlen(msg), 0); // the "client" side sends data

    std::string line = input.readLine();
    EXPECT_EQ(line, "hello world");

    ::close(fds[1]);
    ::close(fds[0]);
}

// empty line
TEST(SocketTCPInputTest, ReadEmptyLine)
{
    int fds[2];
    createSocketPair(fds);

    SocketTCPInput input(fds[0]);

    const char* msg = "\n";
    ::send(fds[1], msg, strlen(msg), 0);

    std::string line = input.readLine();
    EXPECT_EQ(line, "");

    ::close(fds[1]);
    ::close(fds[0]);
}

// two lines in a row
TEST(SocketTCPInputTest, ReadMultipleLines)
{
    int fds[2];
    createSocketPair(fds);

    SocketTCPInput input(fds[0]);

    const char* msg = "first line\nsecond line\n";
    ::send(fds[1], msg, strlen(msg), 0);

    std::string line1 = input.readLine();
    std::string line2 = input.readLine();

    EXPECT_EQ(line1, "first line");
    EXPECT_EQ(line2, "second line");

    ::close(fds[1]);
    ::close(fds[0]);
}

// EOF after partial line returns the buffer
TEST(SocketTCPInputTest, EofWithPartialLineReturnsBuffer)
{
    int fds[2];
    createSocketPair(fds);
    SocketTCPInput input(fds[0]);

    // send partial line without \n
    const char* msg = "abc123";
    ::send(fds[1], msg, strlen(msg), 0);
    
    ::close(fds[1]);

    std::string line = input.readLine();
    EXPECT_EQ(line, "abc123");
    ::close(fds[0]);   
}



