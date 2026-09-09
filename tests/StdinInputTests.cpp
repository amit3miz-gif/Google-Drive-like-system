#include "gtest/gtest.h"
#include "io/StdinInput.h" 
#include <sstream>
#include <iostream>
using namespace std;


// Helper class to temporarily redirect cin to read from a string
class CinRedirect {
public:
    explicit CinRedirect(const std::string& data)
        : m_input(data)
        , m_oldBuf(cin.rdbuf(m_input.rdbuf()))
    {}

    ~CinRedirect() {
        cin.rdbuf(m_oldBuf);
    }

private:
    istringstream m_input;
    streambuf*    m_oldBuf;
};


// SANITY TESTS:

TEST(StdinInputTest, Sanity_ReadsSingleLineCorrectly)
{
    // simulate a single line of user input: "hello world\n"
    CinRedirect redirect("hello world\n"); // Redirect cin to read from this string
    StdinInput input;
    string line = input.readLine();
    EXPECT_EQ(line, "hello world");
}

TEST(StdinInputTest, Sanity_ReadsMultipleLinesInOrder)
{
    // simulate two lines of input
    CinRedirect redirect("first line\nsecond line\n");
    StdinInput input;
    string line1 = input.readLine();
    string line2 = input.readLine();
    EXPECT_EQ(line1, "first line");
    EXPECT_EQ(line2, "second line");
}


// NEGATIVE TESTS:

TEST(StdinInputTest, Negative_ReturnsEmptyStringWhenNoInput)
{
    // simulate an empty input source (no characters at all)
    CinRedirect redirect(""); // stdin behaves as if EOF is reached immediately
    StdinInput input;
    string line = input.readLine();
    EXPECT_EQ(line, "");
}

TEST(StdinInputTest, Negative_ReadingPastEndReturnsEmptyNotPreviousLine)
{
    // simulate exactly one line of input
    CinRedirect redirect("only line\n");
    StdinInput input;
    string line1 = input.readLine();
    string line2 = input.readLine();
    EXPECT_EQ(line1, "only line");
    EXPECT_EQ(line2, "");
}


// BOUNDARY TESTS:

TEST(StdinInputTest, Boundary_VeryLongLineIsReadCompletely)
{
    // build a very long line (e.g., 10,000 'x' characters)
    string longLine(10000, 'x');
    string data = longLine + "\n";
    CinRedirect redirect(data);
    StdinInput input;
    string result = input.readLine();
    EXPECT_EQ(result.size(), longLine.size());
    EXPECT_EQ(result, longLine);
}


// EDGE CASE TESTS:

TEST(StdinInputTest, EdgeCase_EmptyLineIsReturnedAsEmptyString)
{
    // first line is empty ("\n"), second line is "hello"
    CinRedirect redirect("\nhello\n");
    StdinInput input;
    string line1 = input.readLine();
    string line2 = input.readLine();
    EXPECT_EQ(line1, "");
    EXPECT_EQ(line2, "hello");
}

TEST(StdinInputTest, EdgeCase_LineWithOnlySpacesIsPreserved)
{
    // one line that contains only spaces, then newline
    CinRedirect redirect("    \n");
    StdinInput input;
    string line = input.readLine();
    EXPECT_EQ(line, "    ");
}



TEST(StdinInputTest, EdgeCase_LastLineWithoutTrailingNewline)
{
    // input that does NOT end with '\n'
    CinRedirect redirect("no newline at end");
    StdinInput input;
    string line1 = input.readLine();
    string line2 = input.readLine();
    EXPECT_EQ(line1, "no newline at end");
    EXPECT_EQ(line2, "");
}