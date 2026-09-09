#include "gtest/gtest.h"
#include "io/StdoutOutput.h"
#include <sstream>
#include <iostream>
using namespace std;

// Helper class to temporarily redirect cout to an internal string buffer
class CoutRedirect {
public:
    CoutRedirect()
        : m_oldBuf(cout.rdbuf(m_output.rdbuf())) // Save old buffer and replace it with m_output's buffer
    {}

    ~CoutRedirect() {
        cout.rdbuf(m_oldBuf); // Put back the original buffer so cout writes to the console again
    }

    std::string getOutput() const {
        return m_output.str();
    }

private:
    std::ostringstream m_output;
    std::streambuf*    m_oldBuf;
};



// SANITY TESTS:

TEST(StdoutOutputTest, Sanity_WritesSingleLineWithNewline)
{
    // write a single line
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine("hello world");
    EXPECT_EQ(redirect.getOutput(), "hello world\n");
}

TEST(StdoutOutputTest, Sanity_WritesMultipleLinesInOrder)
{
    // write two lines one after another
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine("first line");
    output.writeLine("second line");
    EXPECT_EQ(redirect.getOutput(), "first line\nsecond line\n");
}


// NEGATIVE TESTS:

TEST(StdoutOutputTest, Negative_WritesEmptyStringAsJustNewline)
{
    // write an empty string
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine("");
    EXPECT_EQ(redirect.getOutput(), "\n");
}


// BOUNDARY TESTS:

TEST(StdoutOutputTest, Boundary_VeryLongLineIsWrittenCompletely)
{
    // build a very long string (e.g., 10,000 'x' characters)
    string longLine(10000, 'x');
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine(longLine);

    string expected = longLine + "\n";
    string actual = redirect.getOutput();
    EXPECT_EQ(actual.size(), expected.size());
    EXPECT_EQ(actual, expected);
}


// EDGE CASE TESTS:

TEST(StdoutOutputTest, EdgeCase_LineWithOnlySpacesIsPreserved)
{
    // write a string that contains only spaces
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine("    ");
    EXPECT_EQ(redirect.getOutput(), "    \n");
}

TEST(StdoutOutputTest, EdgeCase_StringContainingNewlineInsideIsNotModified)
{
    // message already contains a newline inside
    std::string msg = "hello\nworld";
    CoutRedirect redirect;
    StdoutOutput output;
    output.writeLine(msg);
    EXPECT_EQ(redirect.getOutput(), "hello\nworld\n");
}


