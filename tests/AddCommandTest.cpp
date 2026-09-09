#include <gtest/gtest.h>
#include "commands/AddCommand.h"
#include "storage/IFileRepository.h"
#include "compression/ICompressor.h"
#include <algorithm>
#include <vector>

// Fake implementations for pure unit testing
class FakeCompressorAdd : public ICompressor {
public:
    std::string lastInput;
    std::string compressedReturn = "COMPRESSED";

    std::string compress(const std::string& s) override {
        lastInput = s;
        return compressedReturn;
    }

    std::string decompress(const std::string& s) override { return s; }
};

class FakeRepoAdd : public IFileRepository {
public:
    std::string savedFileName;
    std::string savedData;
    bool saved = false;
    int saveCount = 0;

    // save list of name files
    std::vector<std::string> existingNames;
    // Flags to simulate internal failures
    bool shouldThrowOnListFiles = false;
    bool shouldThrowOnSave = false;

    void save(const std::string& fileName, const std::string& data) override {
        if (shouldThrowOnSave) {
            throw std::runtime_error("save failed");
        }

        saved = true;
        saveCount++;
        savedFileName = fileName;
        savedData = data;

        if (std::find(existingNames.begin(), existingNames.end(), fileName) == existingNames.end()) {
            existingNames.push_back(fileName);
        }
    }

    std::string load(const std::string&) const override { return ""; }

    std::vector<std::string> listFiles() const override {
        if (shouldThrowOnListFiles) {
            throw std::runtime_error("list failed");
        }
        return existingNames;
    }

    void remove(const std::string&) override {}
};


// Normal case 
TEST(AddCommandUnitTest, SaveCompressedNormalCase) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    cmd.setArgs("file1.txt testtext");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 201);        // file created
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ("testtext", compressor.lastInput);
    EXPECT_TRUE(repo.saved);
    EXPECT_EQ("file1.txt", repo.savedFileName);
    EXPECT_EQ("COMPRESSED", repo.savedData);
}

// Only filename, empty text 
TEST(AddCommandUnitTest, SaveEmptyText) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    cmd.setArgs("empty.txt");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 201);        // still a valid creation
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ("", compressor.lastInput);
    EXPECT_TRUE(repo.saved);
    EXPECT_EQ("empty.txt", repo.savedFileName);
    EXPECT_EQ("COMPRESSED", repo.savedData); // compressor always returns this
}

// Wrong args, expecting failure
TEST(AddCommandUnitTest, InvalidArgsReturnsFailure) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    // Simulate an empty argument string - failure
    cmd.setArgs("");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
    EXPECT_FALSE(repo.saved);
}

// Text with spaces, punctuation (boundary)
TEST(AddCommandUnitTest, SaveTextWithSpacesAndPunctuation) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    std::string originalText = "Hello, world! 12345 $$";
    cmd.setArgs("myfile.txt " + originalText);

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 201);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(originalText, compressor.lastInput);
    EXPECT_TRUE(repo.saved);
    EXPECT_EQ("myfile.txt", repo.savedFileName);
    EXPECT_EQ("COMPRESSED", repo.savedData);
}

// Very large input
TEST(AddCommandUnitTest, SaveVeryLargeText) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    std::string largeText(50000, 'A');
    cmd.setArgs("big.txt " + largeText);

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 201);
    EXPECT_TRUE(res.body.empty());
    EXPECT_EQ(largeText, compressor.lastInput);
    EXPECT_TRUE(repo.saved);
    EXPECT_EQ("big.txt", repo.savedFileName);
    EXPECT_EQ("COMPRESSED", repo.savedData);
}

// Duplicate filename should cause AddCommand to return false and NOT overwrite the file
TEST(AddCommandUnitTest, DuplicateFileNameFailsAndDoesNotOverwrite){
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    cmd.setArgs("a.txt hello");
    CommandResult first = cmd.execute();

    ASSERT_EQ(first.statusCode, 201);
    ASSERT_TRUE(first.body.empty());
    ASSERT_TRUE(repo.saved);
    ASSERT_EQ(repo.savedFileName, "a.txt");
    ASSERT_EQ(repo.savedData, "COMPRESSED");
    ASSERT_EQ(repo.saveCount, 1);

    cmd.setArgs("a.txt world");
    CommandResult second = cmd.execute();

    ASSERT_EQ(second.statusCode, 400);   // logical error: duplicate name
    ASSERT_TRUE(second.body.empty());
    ASSERT_EQ(repo.saveCount, 1);        // still only one save
}

// Internal error while listing files should return 500
TEST(AddCommandUnitTest, ListFilesInternalErrorReturns500) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    repo.shouldThrowOnListFiles = true;

    cmd.setArgs("file.txt some text");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
    EXPECT_FALSE(repo.saved);
}

// Internal error while saving should return 500
TEST(AddCommandUnitTest, SaveInternalErrorReturns500) {
    FakeRepoAdd repo;
    FakeCompressorAdd compressor;
    AddCommand cmd(repo, compressor);

    repo.shouldThrowOnSave = true;

    cmd.setArgs("file.txt some text");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
    EXPECT_FALSE(repo.saved);
    EXPECT_EQ(repo.saveCount, 0);
}
