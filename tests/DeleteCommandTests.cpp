#include <gtest/gtest.h>
#include "commands/DeleteCommand.h"
#include "storage/IFileRepository.h"
#include <vector>
#include <string>
#include <algorithm>
#include <stdexcept>

// Fake repository for testing DELETE command
class FakeRepoDelete : public IFileRepository {
public:
    std::vector<std::string> existingNames;
    int removeCount = 0;
    std::string lastRemovedName;
    bool shouldThrowInternalError = false;

    void save(const std::string& fileName, const std::string& data) override {
        (void)data;
        if (std::find(existingNames.begin(), existingNames.end(), fileName) == existingNames.end()) {
            existingNames.push_back(fileName);
        }
    }

    std::string load(const std::string& fileName) const override {
        // Not needed for these tests
        (void)fileName;
        return "";
    }

    std::vector<std::string> listFiles() const override {
        return existingNames;
    }

    void remove(const std::string& fileName) override {
        if (shouldThrowInternalError) {
            throw FileRemoveFailed(fileName);
        }
        auto it = std::find(existingNames.begin(), existingNames.end(), fileName);
        if (it == existingNames.end()) {
            throw FileNotFoundError(fileName);
        }
        lastRemovedName = fileName;
        existingNames.erase(it);
        removeCount++;
    }
};

// Basic: name() must be "DELETE"
TEST(DeleteCommandUnitTest, NameIsDelete) {
    FakeRepoDelete repo;
    DeleteCommand cmd(repo);

    EXPECT_EQ(cmd.name(), "delete");
}

// Delete existing file successfully
TEST(DeleteCommandUnitTest, DeleteExistingFileReturns204AndRemovesFile) {
    FakeRepoDelete repo;
    repo.existingNames = {"a.txt", "b.txt"};

    DeleteCommand cmd(repo);
    cmd.setArgs("a.txt");

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 204);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 1);
    EXPECT_EQ(repo.lastRemovedName, "a.txt");
    // make sure a.txt no longer exists
    auto files = repo.listFiles();
    EXPECT_EQ(std::find(files.begin(), files.end(), "a.txt"), files.end());
    // b.txt should still exist
    EXPECT_NE(std::find(files.begin(), files.end(), "b.txt"), files.end());
}

// Missing file name argument
TEST(DeleteCommandUnitTest, EmptyFileNameReturns400) {
    FakeRepoDelete repo;
    DeleteCommand cmd(repo);

    cmd.setArgs("");   // no file name provided
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 0);
}

// Non-existing file 
TEST(DeleteCommandUnitTest, NonExistingFileReturns404) {
    FakeRepoDelete repo;
    repo.existingNames = {"x.txt"}; // only x.txt exists

    DeleteCommand cmd(repo);
    cmd.setArgs("missing.txt"); // try to delete a non-existing file

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 404); 
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 0);
}

// Extra arguments after file name: invalid command
TEST(DeleteCommandUnitTest, ExtraArgsAfterFileNameAreBadRequest) {
    FakeRepoDelete repo;
    repo.existingNames = {"log.txt"};

    DeleteCommand cmd(repo);
    cmd.setArgs("log.txt extraArg");

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 0);

    auto files = repo.listFiles();
    // log.txt should still exist
    EXPECT_NE(std::find(files.begin(), files.end(), "log.txt"), files.end());
}

// File name with punctuation
TEST(DeleteCommandUnitTest, FileNameWithPunctuation) {
    FakeRepoDelete repo;
    repo.existingNames = {"we!rd_n@me.txt"};

    DeleteCommand cmd(repo);
    cmd.setArgs("we!rd_n@me.txt");

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 204);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 1);

    auto files = repo.listFiles();
    EXPECT_EQ(std::find(files.begin(), files.end(), "we!rd_n@me.txt"), files.end());
}

// Whitespace-only argument
TEST(DeleteCommandUnitTest, WhitespaceOnlyArgsReturns400) {
    FakeRepoDelete repo;
    DeleteCommand cmd(repo);

    cmd.setArgs("    "); // only spaces
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_EQ(repo.removeCount, 0);
}

// Internal error in repository should return 500
TEST(DeleteCommandUnitTest, InternalErrorReturns500) {
    FakeRepoDelete repo;
    repo.existingNames = {"a.txt"};
    repo.shouldThrowInternalError = true;

    DeleteCommand cmd(repo);
    cmd.setArgs("a.txt");

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(repo.removeCount, 0);
}