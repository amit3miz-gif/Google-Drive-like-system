#include <gtest/gtest.h>
#include "commands/SearchCommand.h"
#include "storage/IFileRepository.h"
#include "compression/ICompressor.h"

#include <map>
#include <sstream>
#include <stdexcept>
#include <string>

using namespace std;

// Helper class Fake repository used only for tests.
class FakeFileRepositorySearch : public IFileRepository {
private:
    map<string, string> files_;

public:
    // Flag to simulate internal repository failure on load.
    bool shouldThrowInternalErrorOnLoad = false;

    // Save or overwrite a file.
    void save(const string& fileName, const string& data) override {
        files_[fileName] = data;
    }

    // Load the file's content. Throw if not found.
    string load(const string& fileName) const override {
        if (shouldThrowInternalErrorOnLoad) {
            throw logic_error("internal repository error");
        }
        auto it = files_.find(fileName);
        if (it == files_.end()) {
            throw runtime_error("file not found: " + fileName);
        }
        return it->second;
    }

    // Delete a file, Throw if not found.
    void remove(const string& fileName) override {
        auto it = files_.find(fileName);
        if (it == files_.end()) {
            throw runtime_error("file not found: " + fileName);
        }
        files_.erase(it);
    }

    // Return the names of all stored files.
    vector<string> listFiles() const override {
        vector<string> names;
        names.reserve(files_.size());
        for (const auto& kv : files_) {
            names.push_back(kv.first);
        }
        return names;
    }
};

// Simple compressor fake that does no real compression.
class PassThroughCompressorSearch : public ICompressor {
public:
    string compress(const string& input) override {
        return input;
    }

    string decompress(const string& input) override {
        return input;
    }
};

// Sanity test: name() must return "search" so that the app can register it correctly.
TEST(SearchCommand, NameIsSearch) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    SearchCommand cmd(repo, compressor);
    ASSERT_EQ(cmd.name(), "search");
}

// Sanity test: one file contains the search text, another does not.
TEST(SearchCommand, SimpleSanityFindsMatchingFile) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("notes.txt", "hello world");
    repo.save("other.txt", "nothing interesting here");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("hello");

    CommandResult res = cmd.execute();

    // The command should report success (found at least one file).
    ASSERT_EQ(res.statusCode, 200);
    // Body should contain only the matching file name.
    EXPECT_NE(res.body.find("notes.txt"), string::npos);
    EXPECT_EQ(res.body.find("other.txt"), string::npos);
}

// Boundary test: repository is empty, so there is no file to search.
TEST(SearchCommand, EmptyRepositoryBoundary) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("anything");

    CommandResult res = cmd.execute();

    // No matches are possible.
    ASSERT_EQ(res.statusCode, 200);
    // Nothing should be printed.
    ASSERT_TRUE(res.body.empty());
}

// Boundary test: empty search text is treated as invalid command usage.
TEST(SearchCommand, EmptySearchTextBoundary) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("file.txt", "some content");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs(""); // no search term

    CommandResult res = cmd.execute();

    // Invalid command structure (no search text).
    ASSERT_EQ(res.statusCode, 400);
    ASSERT_TRUE(res.body.empty());
}

// Edge case: the same search text appears in more than one file.
TEST(SearchCommand, MultipleMatchesEdge) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("a.txt", "foo bar hello");
    repo.save("b.txt", "hello again");
    repo.save("c.txt", "no match here");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("hello");

    CommandResult res = cmd.execute();

    ASSERT_EQ(res.statusCode, 200);
    EXPECT_NE(res.body.find("a.txt"), string::npos);
    EXPECT_NE(res.body.find("b.txt"), string::npos);
    EXPECT_EQ(res.body.find("c.txt"), string::npos);
}

// Edge case: search text with spaces and special characters.
TEST(SearchCommand, SpecialCharactersEdge) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("log.txt",  "Error: [code 42] something went wrong");
    repo.save("info.txt", "All good :)");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("[code 42]");

    CommandResult res = cmd.execute();

    ASSERT_EQ(res.statusCode, 200);
    EXPECT_NE(res.body.find("log.txt"), string::npos);
    EXPECT_EQ(res.body.find("info.txt"), string::npos);
}

// Edge case: search for a string that does not exist in any file.
TEST(SearchCommand, NoMatchesNegative) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("a.txt", "aaa");
    repo.save("b.txt", "bbb");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("xyz"); // not present in any file

    CommandResult res = cmd.execute();

    // Search failed to find any file.
    ASSERT_EQ(res.statusCode, 200);
    ASSERT_TRUE(res.body.empty());
}

// New requirement: search should also match on file names.
TEST(SearchCommand, MatchInFileNameOnly) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    // Content does NOT contain the search text, only the file name does.
    repo.save("report_2025.txt", "some generic content");
    repo.save("notes.txt", "nothing here");

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("2025"); // appears only in file name "report_2025.txt"

    CommandResult res = cmd.execute();

    ASSERT_EQ(res.statusCode, 200);
    // Body should include only the matching file name.
    EXPECT_NE(res.body.find("report_2025.txt"), string::npos);
    EXPECT_EQ(res.body.find("notes.txt"), string::npos);
}

// Per-file repository error should be skipped
TEST(SearchCommand, PerFileErrorsAreSkipped) {
    FakeFileRepositorySearch repo;
    PassThroughCompressorSearch compressor;

    repo.save("a.txt", "hello");
    repo.shouldThrowInternalErrorOnLoad = true;

    SearchCommand cmd(repo, compressor);
    cmd.setArgs("hello");

    CommandResult res = cmd.execute();

    ASSERT_EQ(res.statusCode, 200);
    ASSERT_TRUE(res.body.empty());
}
