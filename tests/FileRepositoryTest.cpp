#include <gtest/gtest.h>
#include "storage/FileStorageRepository.h"
#include <stdexcept>
#include <string>
#include <vector>
#include <algorithm>
#include <cstdlib>


// Helper functions
// Delete test dir
void deleteTestDir(const std::string& testDir) {
    std::system(("rm -rf " + testDir).c_str());
}
// Clean test dir
void cleanTestDir(const std::string& testDir) {
    deleteTestDir(testDir);
    std::system(("mkdir -p " + testDir).c_str());
}


// save and load file
TEST(FileRepository, SaveAndLoadSanity) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    repo.save("a.txt", "abc123");
    std::string loaded = repo.load("a.txt");
    ASSERT_EQ(loaded, "abc123");

    deleteTestDir(testDir);
}

// loading non-existing file
TEST(FileRepository, LoadNonExistingFileThrows) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    ASSERT_THROW(repo.load("nonexistent.txt"), FileNotFoundError);

    deleteTestDir(testDir);
}

// empty file
TEST(FileRepository, EmptyFileBoundary) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    repo.save("empty.txt", "");
    ASSERT_EQ(repo.load("empty.txt"), "");

    deleteTestDir(testDir);
}

// large file
TEST(FileRepository, BigFileBoundary) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    std::string big(10000, 'x');
    repo.save("big.txt", big);
    ASSERT_EQ(repo.load("big.txt"), big);

    deleteTestDir(testDir);
}

// special characters in file name
TEST(FileRepository, SpecialCharsInFileNameEdge) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    std::string fn = "we!rd n@me.txt";
    repo.save(fn, "test");
    ASSERT_EQ(repo.load(fn), "test");

    deleteTestDir(testDir);
}

// overwrite file
TEST(FileRepository, OverwriteFileEdge) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    repo.save("dup.txt", "first");
    repo.save("dup.txt", "second");
    ASSERT_EQ(repo.load("dup.txt"), "second");

    deleteTestDir(testDir);
}

// returns all file names
TEST(FileRepository, ListFilesBasic) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);

    FileStorageRepository repo{testDir};
    repo.save("f1.txt", "foo");
    repo.save("f2.txt", "bar");
    auto files = repo.listFiles();
    ASSERT_NE(std::find(files.begin(), files.end(), "f1.txt"), files.end());
    ASSERT_NE(std::find(files.begin(), files.end(), "f2.txt"), files.end());

    deleteTestDir(testDir);
}

// delete existing file
TEST(FileRepository, RemoveExistingFile) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);
    FileStorageRepository repo{testDir};
    repo.save("to_delete.txt", "content");
    ASSERT_EQ(repo.load("to_delete.txt"), "content");
    // action
    repo.remove("to_delete.txt");
    // now loading should throw
    ASSERT_THROW(repo.load("to_delete.txt"), FileNotFoundError);
    
    deleteTestDir(testDir);
}

// delete non-existing file throws
TEST(FileRepository, RemoveNonExistingFileThrows) {
    std::string testDir = "testdata";
    cleanTestDir(testDir);
    FileStorageRepository repo{testDir};
    ASSERT_THROW(repo.remove("no_such_file.txt"), FileNotFoundError);

    deleteTestDir(testDir);
}

