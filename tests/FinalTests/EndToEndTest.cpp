#include <gtest/gtest.h>
#include "parser/ConsoleParser.h"
#include "io/IInput.h"
#include "storage/FileStorageRepository.h"
#include "compression/RLECompressor.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"
#include "commands/DeleteCommand.h"

#include <string>
#include <vector>
#include <map>
#include <filesystem>

using namespace std;
namespace fs = std::filesystem;


// Fake input - returns predefined lines one by one.
class FakeInput : public IInput {
public:
    explicit FakeInput(const vector<string>& lines)
        : lines_(lines), index_(0) {}

    string readLine() override {
        if (index_ >= lines_.size()) {
            // Simulate EOF: empty string
            return "";
        }
        return lines_[index_++];
    }

private:
    vector<string> lines_;
    size_t index_;
};

// Helper to run parser + commands and collect results.
static vector<CommandResult> runAppOnce(
    ConsoleParser& parser,
    map<string, ICommand*>& commands,
    int maxSteps = 20)
{
    vector<CommandResult> results;

    for (int i = 0; i < maxSteps; ++i) {
        auto cmdPair = parser.nextCommand();
        const string& name = cmdPair.first;
        const string& args = cmdPair.second;

        // Stop on EOF / empty command (both name and args empty)
        if (name.empty() && args.empty()) {
            break;
        }

        auto it = commands.find(name);
        if (it == commands.end()) {
            // Unknown command name -> ignore (in the real App this would be 400)
            continue;
        }

        ICommand* cmd = it->second;
        cmd->setArgs(args);
        CommandResult res = cmd->execute();
        results.push_back(res);
    }

    return results;
}

// End-to-end test: POST files, SEARCH, then GET - full flow.
TEST(EndToEndTest, AddSearchGet_FullFlow)
{
    // Clean test directory so old files will not affect the test
    fs::remove_all("e2e_testdata");

    // Input commands as the user would type them
    vector<string> inputLines = {
        "POST file1.txt hello world",
        "POST file2.txt another file",
        "SEARCH hello",
        "GET file1.txt",
        ""   // end of input
    };

    FakeInput input(inputLines);
    ConsoleParser parser(input);

    // Real storage and compressor
    FileStorageRepository repo("e2e_testdata");
    RLECompressor compressor;

    // Create command instances
    AddCommand postCmd(repo, compressor);
    GetCommand getCmd(repo, compressor);
    SearchCommand searchCmd(repo, compressor);
    DeleteCommand deleteCmd(repo);

    // Register commands by their lowercase names
    map<string, ICommand*> commands;
    commands[postCmd.name()] = &postCmd;   // "post"
    commands[getCmd.name()] = &getCmd;    // "get"
    commands[searchCmd.name()] = &searchCmd; // "search"
    commands[deleteCmd.name()] = &deleteCmd; // "delete"

    // Run the whole sequence
    vector<CommandResult> results = runAppOnce(parser, commands);

    // We expect 4 recognized commands: 2 POST, 1 SEARCH, 1 GET
    ASSERT_EQ(results.size(), 4u);

    // First POST
    EXPECT_EQ(results[0].statusCode, 201);
    EXPECT_TRUE(results[0].body.empty());

    // Second POST
    EXPECT_EQ(results[1].statusCode, 201);
    EXPECT_TRUE(results[1].body.empty());

    // SEARCH "hello" - should match file1.txt by content
    EXPECT_EQ(results[2].statusCode, 200);
    EXPECT_NE(results[2].body.find("file1.txt"), string::npos);

    // GET file1.txt should return its original content
    EXPECT_EQ(results[3].statusCode, 200);
    EXPECT_EQ(results[3].body, "hello world");
}

// End-to-end test: invalid commands do not break the flow
TEST(EndToEndTest, InvalidCommandsDoNotBreakFlow)
{
    fs::remove_all("e2e_testdata");

    vector<string> inputLines = {
        "FOO something",        // unknown command
        "POST x.txt hi",        // valid
        "BAR 123",              // unknown
        "GET x.txt",            // valid
        ""                      // end
    };

    FakeInput input(inputLines);
    ConsoleParser parser(input);

    FileStorageRepository repo("e2e_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    GetCommand getCmd(repo, compressor);
    SearchCommand searchCmd(repo, compressor);
    DeleteCommand deleteCmd(repo);

    map<string, ICommand*> commands;
    commands[postCmd.name()] = &postCmd;
    commands[getCmd.name()] = &getCmd;
    commands[searchCmd.name()] = &searchCmd;
    commands[deleteCmd.name()] = &deleteCmd;

    vector<CommandResult> results = runAppOnce(parser, commands);

    // Only POST and GET are recognized -> 2 results
    ASSERT_EQ(results.size(), 2u);

    EXPECT_EQ(results[0].statusCode, 201); // POST x.txt hi
    EXPECT_TRUE(results[0].body.empty());

    EXPECT_EQ(results[1].statusCode, 200); // GET x.txt
    EXPECT_EQ(results[1].body, "hi");
}
