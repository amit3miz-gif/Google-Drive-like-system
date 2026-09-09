#include <gtest/gtest.h>
#include "commands/GetCommand.h"
#include "storage/IFileRepository.h"
#include "compression/ICompressor.h"

// Fake compressor for testing
class FakeCompressorGet : public ICompressor {
public:
    std::string lastInput;
    std::string decompressReturn = "DECOMPRESSED";

    std::string compress(const std::string&) override { return ""; }
    std::string decompress(const std::string& s) override {
        lastInput = s;
        return decompressReturn;
    }
};

// Fake repository for testing
class FakeRepoGet : public IFileRepository {
public:
    mutable std::string loadedFileName;
    std::string dataToLoad = "COMPRESSED";
    bool loaded = false;
    // New flags to simulate failures
    bool shouldThrowNotFound = false;
    bool shouldThrowInternalError = false;
    void save(const std::string&, const std::string&) override {}
    void remove(const std::string&) override {}
    std::string load(const std::string& fileName) const override {
        loadedFileName = fileName;
        // Simulate logical error (e.g., file does not exist) → std::runtime_error → 404
        if (shouldThrowNotFound) {
            throw FileNotFoundError(fileName);
        }
        // Simulate internal system error → different exception type → 500
        if (shouldThrowInternalError) {
            throw FileOpenError(fileName);
        }
        return dataToLoad;
    }
    std::vector<std::string> listFiles() const override { return {}; }
};

// file exists and decompresses correctly
TEST(GetCommandUnitTest, LoadsCompressedFileAndDecompressesIt) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;
    compressor.decompressReturn = "original text";
    repo.dataToLoad = "COMPRESSED";

    GetCommand cmd(repo, compressor);

    cmd.setArgs("myfile.txt");
    CommandResult res = cmd.execute();

    // Verify successful execution
    EXPECT_EQ(res.statusCode, 200);
    EXPECT_EQ(res.body, "original text");
    // Verify decompress was called with correct data
    EXPECT_EQ(compressor.lastInput, "COMPRESSED");
    // Verify correct file was loaded
    EXPECT_EQ(repo.loadedFileName, "myfile.txt");
}

// Missing file name argument
TEST(GetCommandUnitTest, EmptyFileNameFails) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;

    GetCommand cmd(repo, compressor);

    cmd.setArgs(""); // No file name
    CommandResult res = cmd.execute();

    // Verify failure due to missing file name
    EXPECT_EQ(res.statusCode, 400);
    EXPECT_TRUE(res.body.empty());
}

// File not found in repository
TEST(GetCommandUnitTest, FileNotFoundFails) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;
    
    // Simulate file-not-found logical error
    repo.shouldThrowNotFound = true;
    GetCommand cmd(repo, compressor);

    cmd.setArgs("missing.txt");
    CommandResult res = cmd.execute();

    // Verify failure due to file not found
    EXPECT_EQ(res.statusCode, 404);
    EXPECT_TRUE(res.body.empty());
}


// File name with punctuation and decompress called
TEST(GetCommandUnitTest, FileNameWithPunctuation) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;
    compressor.decompressReturn = "decomp";
    repo.dataToLoad = "##COMP##";

    GetCommand cmd(repo, compressor);
    cmd.setArgs("test123!.txt");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 200); 
    EXPECT_EQ(res.body, "decomp");
    EXPECT_EQ(compressor.lastInput, "##COMP##");
    EXPECT_EQ(repo.loadedFileName, "test123!.txt");
}

// Decompress returns empty string (empty file)
TEST(GetCommandUnitTest, DecompressEmptyCompressedData) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;
    repo.dataToLoad = "";           // "read" returns empty
    compressor.decompressReturn = ""; // decompress returns empty

    GetCommand cmd(repo, compressor);
    cmd.setArgs("emptyfile.txt");
    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 200);
    EXPECT_TRUE(res.body.empty());
}

// Simulate internal error in repository
TEST(GetCommandUnitTest, InternalErrorReturns500) {
    FakeRepoGet repo;
    FakeCompressorGet compressor;

    // Simulate internal error (e.g., disk/IO failure)
    repo.shouldThrowInternalError = true;

    GetCommand cmd(repo, compressor);
    cmd.setArgs("anyfile.txt");

    CommandResult res = cmd.execute();

    EXPECT_EQ(res.statusCode, 500);
    EXPECT_TRUE(res.body.empty());
}
