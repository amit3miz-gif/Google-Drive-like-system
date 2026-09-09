#include <gtest/gtest.h>
#include "parser/ConsoleParser.h"
#include "io/IInput.h"

#include <string>
#include <vector>

using namespace std;


// This class simulates an input source that returns predefined lines.
class FakeInputParser : public IInput {
public:
    explicit FakeInputParser(const vector<string>& lines)
        : m_lines(lines), m_index(0) {}

    string readLine() override {
        if (m_index >= m_lines.size()) {
            // Simulate end of input: empty string
            return "";
        }
        return m_lines[m_index++];
    }

private:
    vector<string> m_lines;
    size_t m_index;
};

// Sanity Tests:

// basic command with one argument
TEST(ConsoleParserTest, Sanity_SimpleCommandWithArg)
{
    vector<string> lines = { "get myfile.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "get");
    EXPECT_EQ(args, "myfile.txt");
}

// insert a command without its arguments
TEST(ConsoleParserTest, Sanity_CommandWithoutArgs)
{
    vector<string> lines = { "post" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "post");
    EXPECT_EQ(args, "");
}

// DELETE command with one argument
TEST(ConsoleParserTest, Sanity_DeleteCommandWithArg)
{
    vector<string> lines = { "delete file1.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "delete");
    EXPECT_EQ(args, "file1.txt");
}





// Negative Tests:

// Empty line treated as "no command"
TEST(ConsoleParserTest, Negative_EmptyLine)
{
    vector<string> lines = { "" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "");
    EXPECT_EQ(args, "");
}

// Whitespace only line treated as "no command"
TEST(ConsoleParserTest, Negative_WhitespaceOnlyLine)
{
    vector<string> lines = { "   \t   " };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "");
    EXPECT_EQ(args, "");
}


// No more lines: FakeInputMenu returns "" - no command.
TEST(ConsoleParserTest, Negative_NoMoreLines)
{
    vector<string> lines = { "get file.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [n1, a1] = parser.nextCommand();
    EXPECT_EQ(n1, "get");
    EXPECT_EQ(a1, "file.txt");

    auto [n2, a2] = parser.nextCommand(); // now EOF
    EXPECT_EQ(n2, "");
    EXPECT_EQ(a2, "");
}


// Edge Cases Tests:

// Leading spaces before the command name - invalid
TEST(ConsoleParserTest, Edge_LeadingSpacesBeforeCommand)
{
    vector<string> lines = { "   get file1.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "");
    EXPECT_EQ(args, "");
}

// Command with a single space after the name and no arguments.
TEST(ConsoleParserTest, Edge_CommandNameFollowedBySingleSpaceNoArgs)
{
    vector<string> lines = { "post " };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "post");
    EXPECT_EQ(args, "");
}

// Command with a multiple spaces after the name and no arguments
TEST(ConsoleParserTest, Edge_CommandNameFollowedByManySpacesOnly)
{
    vector<string> lines = { "post    " }; // "post" + 4 spaces
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "post");
    EXPECT_EQ(args, "   "); // 3 spaces
}


// Extra spaces after command name -
// The first space is a separator and the second is part of the text arg
TEST(ConsoleParserTest, Edge_SearchWithDoubleSpaceBeforeText)
{
    vector<string> lines = { "search  hello world" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "search");
    EXPECT_EQ(args, " hello world");
}

// Extra spaces after "search" - more than 2
TEST(ConsoleParserTest, Edge_SearchWithMultipleSpacesBeforeText)
{
    vector<string> lines = { "search    hello" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "search");
    EXPECT_EQ(args, "   hello"); // 3 spaces + "hello"
}

// search with many spaces before text
TEST(ConsoleParserTest, Edge_SearchWithManySpacesBeforeText)
{
    vector<string> lines = { "search        abc" }; // "search" + 8 spaces + "abc"
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "search");
    EXPECT_EQ(args, "       abc"); // 7 spaces + "abc"
}


// search with internal multiple spaces in the text
TEST(ConsoleParserTest, Edge_SearchWithInternalMultipleSpacesInText)
{
    vector<string> lines = { "search a   b   c" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "search");
    EXPECT_EQ(args, "a   b   c"); // the 3-space gaps must be preserved
}


// Multiple spaces between command name and arguments
TEST(ConsoleParserTest, Edge_PostWithDoubleSpaceAfterCommand)
{
    vector<string> lines = { "post  file.txt 0101" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "post");
    EXPECT_EQ(args, " file.txt 0101");
}

// Invalid command name with a space inside
TEST(ConsoleParserTest, Negative_InvalidCommandNameWithSpaceInside)
{
    vector<string> lines = { "ge t file.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "ge");
    EXPECT_EQ(args, "t file.txt");
}

// Command in uppercase should return lowercase name
TEST(ConsoleParserTest, CaseInsensitive_UppercaseCommandName)
{
    vector<string> lines = { "GET myfile.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "get"); 
    EXPECT_EQ(args, "myfile.txt");
}

// Mixed-case command should also be normalized
TEST(ConsoleParserTest, CaseInsensitive_MixedCaseCommandName)
{
    vector<string> lines = { "seArCh  hello world" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "search");
    EXPECT_EQ(args, " hello world");
}

// Uppercase POST command should be normalized
TEST(ConsoleParserTest, CaseInsensitive_UppercasePostCommandName)
{
    vector<string> lines = { "POST file1.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "post");
    EXPECT_EQ(args, "file1.txt");
}

// Mixed-case DELETE command should be normalized
TEST(ConsoleParserTest, CaseInsensitive_MixedCaseDeleteCommandName)
{
    vector<string> lines = { "DeLeTe file2.txt" };
    FakeInputParser input(lines);
    ConsoleParser parser(input);

    auto [name, args] = parser.nextCommand();

    EXPECT_EQ(name, "delete");
    EXPECT_EQ(args, "file2.txt");
}

