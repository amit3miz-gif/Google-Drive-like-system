#include <gtest/gtest.h>
#include "io/SocketTCPOutput.h"

#include <sys/socket.h>
#include <unistd.h>
#include <cstring>
#include <string>

// Helper: Creates a pair of connected local sockets (no real network)
static void createSocketPair(int fds[2])
{
    int res = ::socketpair(AF_UNIX, SOCK_STREAM, 0, fds);
    ASSERT_EQ(res, 0) << "socketpair failed";
}

// Sanity tests

// Single line is sent with newline
TEST(SocketTCPOutputTest, SendSingleLine)
{
    int fds[2];
    createSocketPair(fds);

    {
        SocketTCPOutput output(fds[0]);  // owns fds[0]

        output.writeLine("hello world");

        char buf[1024];
        ssize_t n = ::recv(fds[1], buf, sizeof(buf) - 1, 0);
        ASSERT_GT(n, 0);

        buf[n] = '\0';
        EXPECT_STREQ(buf, "hello world\n");
    }

    ::close(fds[1]);  // the other side
    ::close(fds[0]);
}

// Empty line
TEST(SocketTCPOutputTest, SendEmptyLine)
{
    int fds[2];
    createSocketPair(fds);

    {
        SocketTCPOutput output(fds[0]);

        output.writeLine("");

        char buf[1024];
        ssize_t n = ::recv(fds[1], buf, sizeof(buf) - 1, 0);
        ASSERT_GT(n, 0);

        buf[n] = '\0';
        EXPECT_STREQ(buf, "\n");
    }

    ::close(fds[1]);
    ::close(fds[0]);
}

// Multiple lines in sequence
TEST(SocketTCPOutputTest, SendMultipleLines)
{
    int fds[2];
    createSocketPair(fds);

    {
        SocketTCPOutput output(fds[0]);

        output.writeLine("first");
        output.writeLine("second");

        char buf[1024];
        ssize_t n = ::recv(fds[1], buf, sizeof(buf) - 1, 0);
        ASSERT_GT(n, 0);

        buf[n] = '\0';
        std::string received(buf);

        EXPECT_NE(received.find("first\n"), std::string::npos);
        EXPECT_NE(received.find("second\n"), std::string::npos);
    }

    ::close(fds[1]);
    ::close(fds[0]);
}
