#include <gtest/gtest.h>
#include "menu/ConsoleMenu.h"
#include <map>
#include <string>

// Dummy implementations 
class ConsoleMenuDummyFileRepository : public IFileRepository {
public:
    void save(const std::string& /*fileName*/, const std::string& /*data*/) override {}
    std::string load(const std::string& /*fileName*/) const override { return ""; }
    std::vector<std::string> listFiles() const override { return {}; }
    void remove(const std::string& /*fileName*/) override {}
};

class ConsoleMenuDummyCompressor : public ICompressor {
public:
    std::string compress(const std::string& input) override { return input; }
    std::string decompress(const std::string& input) override { return input; }
};

TEST(ConsoleMenuTests, CreateCommandsReturnsCorrectMap)
{
    // Create dummy dependencies and the menu
    ConsoleMenuDummyFileRepository repo;
    ConsoleMenuDummyCompressor compressor;
    ConsoleMenu menu(repo, compressor);

    // create commands map
    std::map<std::string, ICommand*> commands = menu.createCommands();

    // map size and keys are as expected
    ASSERT_EQ(commands.size(), 4u);

    EXPECT_NE(commands.find("post"), commands.end());
    EXPECT_NE(commands.find("get"), commands.end());
    EXPECT_NE(commands.find("search"), commands.end());
    EXPECT_NE(commands.find("delete"), commands.end());

    // Cleanup: delete commands allocated inside ConsoleMenu
    for (auto& kv : commands) {
        delete kv.second;
    }
    commands.clear();
}
