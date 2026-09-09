#include <gtest/gtest.h>
#include "storage/FileStorageRepository.h"
#include "storage/IFileRepository.h"
#include "compression/RLECompressor.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"
#include "commands/DeleteCommand.h"

#include <string>
#include <vector>
#include <filesystem>
#include <algorithm>

using namespace std;
namespace fs = std::filesystem;

// Helper: split multiline body into separate lines
static vector<string> splitLines(const string& body) {
    vector<string> lines;
    string current;
    for (char c : body) {
        if (c == '\n') {
            lines.push_back(current);
            current.clear();
        } else {
            current.push_back(c);
        }
    }
    if (!current.empty()) {
        lines.push_back(current);
    }
    return lines;
}

// Fake repository that always fails on save (to simulate internal error in POST)
class FailingRepoForPost : public IFileRepository {
public:
    void save(const string& /*fileName*/, const string& /*data*/) override {
        throw runtime_error("save failed");
    }

    string load(const string& /*fileName*/) const override {
        return "";
    }

    vector<string> listFiles() const override {
        return {};
    }

    void remove(const string& /*fileName*/) override {}
};

// Fake repository that throws on load (to simulate internal error in GET)
class FailingRepoForGet : public IFileRepository {
public:
    void save(const string& /*fileName*/, const string& /*data*/) override {}

    string load(const string& /*fileName*/) const override {
        throw runtime_error("load failed");
    }

    vector<string> listFiles() const override {
        return {};
    }

    void remove(const string& /*fileName*/) override {}
};

// Fake repository that throws on listFiles (to simulate internal error in SEARCH)
class FailingRepoForSearch : public IFileRepository {
public:
    void save(const string& /*fileName*/, const string& /*data*/) override {}

    string load(const string& /*fileName*/) const override {
        return "";
    }

    vector<string> listFiles() const override {
        throw runtime_error("listFiles failed");
    }

    void remove(const string& /*fileName*/) override {}
};

// Acceptance 1: add -> get 
TEST(AcceptanceTest, AddThenGet_BasicFlow)
{
    // Clean test directory so old files will not affect the test
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    GetCommand getCmd(repo, compressor);

    // POST file1.txt with "hello world"
    postCmd.setArgs("file1.txt hello world");
    CommandResult postRes = postCmd.execute();

    EXPECT_EQ(postRes.statusCode, 201);
    EXPECT_TRUE(postRes.body.empty());

    // GET file1.txt should return 200 and the original text
    getCmd.setArgs("file1.txt");
    CommandResult getRes = getCmd.execute();

    EXPECT_EQ(getRes.statusCode, 200);
    EXPECT_EQ(getRes.body, "hello world");
}

// Acceptance 2: search
TEST(AcceptanceTest, SearchPrintsMatchingFilesOnly)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    SearchCommand searchCmd(repo, compressor);

    // Prepare repository contents
    postCmd.setArgs("a.txt hello there");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    postCmd.setArgs("b.txt something else");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    postCmd.setArgs("c.txt hello again");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    // Search for "hello"
    searchCmd.setArgs("hello");
    CommandResult searchRes = searchCmd.execute();

    EXPECT_EQ(searchRes.statusCode, 200);

    // Extract file names from the body
    std::vector<std::string> files;
    std::istringstream iss(searchRes.body);
    std::string token;
    while (iss >> token) {
        files.push_back(token);
    }

    // We only check membership, not order
    EXPECT_EQ(files.size(), 2u);
    EXPECT_NE(std::find(files.begin(), files.end(), "a.txt"), files.end());
    EXPECT_NE(std::find(files.begin(), files.end(), "c.txt"), files.end());
    EXPECT_EQ(std::find(files.begin(), files.end(), "b.txt"), files.end());
}

// Acceptance 3: POST with empty file name returns 400
TEST(AcceptanceTest, MissingFileNameReturns400)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);

    // Empty args -> missing file name
    postCmd.setArgs("");
    CommandResult res = postCmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 4: GET on missing file returns 404
TEST(AcceptanceTest, GetMissingFileReturns404)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    GetCommand getCmd(repo, compressor);

    getCmd.setArgs("missing.txt");
    CommandResult res = getCmd.execute();

    EXPECT_EQ(res.statusCode, 404);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 5: POST duplicate file name returns 400
TEST(AcceptanceTest, DuplicateFileNameReturns400)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);

    postCmd.setArgs("dup.txt first");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    postCmd.setArgs("dup.txt second");
    CommandResult res = postCmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 6: DELETE existing file and then DELETE again
TEST(AcceptanceTest, DeleteExistingAndNonExistingFile)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    DeleteCommand deleteCmd(repo);

    // Create a file
    postCmd.setArgs("to_delete.txt some content");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    // First DELETE -> 204
    deleteCmd.setArgs("to_delete.txt");
    CommandResult first = deleteCmd.execute();

    EXPECT_EQ(first.statusCode, 204);
    EXPECT_TRUE(first.body.empty());

    // Second DELETE on same file -> 404
    deleteCmd.setArgs("to_delete.txt");
    CommandResult second = deleteCmd.execute();

    EXPECT_EQ(second.statusCode, 404);
    EXPECT_TRUE(second.body.empty());
}

// Acceptance 7: DELETE with invalid args (empty or extra) returns 400
TEST(AcceptanceTest, DeleteWithInvalidArgsReturns400)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    DeleteCommand deleteCmd(repo);

    // Empty args
    deleteCmd.setArgs("");
    CommandResult res1 = deleteCmd.execute();
    EXPECT_EQ(res1.statusCode, 400);
    EXPECT_TRUE(res1.body.empty());

    // Extra argument after file name
    deleteCmd.setArgs("file.txt extra");
    CommandResult res2 = deleteCmd.execute();
    EXPECT_EQ(res2.statusCode, 400);
    EXPECT_TRUE(res2.body.empty());
}

// Acceptance 8: POST internal failure returns 500
TEST(AcceptanceTest, PostInternalErrorReturns500)
{
    FailingRepoForPost repo;
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    postCmd.setArgs("file.txt data");

    CommandResult res = postCmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 9: GET internal failure returns 500
TEST(AcceptanceTest, GetInternalErrorReturns500)
{
    FailingRepoForGet repo;
    RLECompressor compressor;

    GetCommand getCmd(repo, compressor);
    getCmd.setArgs("file.txt");

    CommandResult res = getCmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 10: SEARCH internal failure returns 500
TEST(AcceptanceTest, SearchInternalErrorReturns500)
{
    FailingRepoForSearch repo;
    RLECompressor compressor;

    SearchCommand searchCmd(repo, compressor);
    searchCmd.setArgs("hello");

    CommandResult res = searchCmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 11: SEARCH with empty search text returns 400
TEST(AcceptanceTest, SearchWithEmptySearchTextReturns400)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    SearchCommand searchCmd(repo, compressor);

    // Empty search text -> bad request
    searchCmd.setArgs("");
    CommandResult res = searchCmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 12: SEARCH with no matching files returns 200 and empty body
TEST(AcceptanceTest, SearchNoMatchesReturnsEmptyBody)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    SearchCommand searchCmd(repo, compressor);

    // Create files that do NOT contain the search text
    postCmd.setArgs("a.txt some content here");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    postCmd.setArgs("b.txt another file");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    // Search for text that does not appear in any file
    searchCmd.setArgs("zzz");
    CommandResult res = searchCmd.execute();

    EXPECT_EQ(res.statusCode, 200);
    EXPECT_TRUE(res.body.empty());
}

// Acceptance 13: SEARCH matches by file name even if content does not contain the text
TEST(AcceptanceTest, SearchMatchesByFileNameNotOnlyContent)
{
    fs::remove_all("acceptance_testdata");

    FileStorageRepository repo("acceptance_testdata");
    RLECompressor compressor;

    AddCommand postCmd(repo, compressor);
    SearchCommand searchCmd(repo, compressor);

    // File whose NAME contains "hello", but content does NOT
    postCmd.setArgs("hello_file.txt some unrelated content");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    // Another file that should not match at all
    postCmd.setArgs("other.txt no match here");
    EXPECT_EQ(postCmd.execute().statusCode, 201);

    // Search by "hello" - should match hello_file.txt because of the file name
    searchCmd.setArgs("hello");
    CommandResult res = searchCmd.execute();

    EXPECT_EQ(res.statusCode, 200);

    vector<string> lines = splitLines(res.body);

    ASSERT_EQ(lines.size(), 1u);
    EXPECT_EQ(lines[0], "hello_file.txt");
}

