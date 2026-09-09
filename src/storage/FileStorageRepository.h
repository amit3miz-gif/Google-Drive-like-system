#ifndef FILE_STORAGE_REPOSITORY_H
#define FILE_STORAGE_REPOSITORY_H

#include "IFileRepository.h"
#include "FileExceptions.h"
#include <string>
#include <vector>
#include <mutex>

class FileStorageRepository : public IFileRepository {
private:
    std::string basePath;
    mutable std::mutex mtx;
public:
    // Constructor: initialize repository with base directory
    FileStorageRepository(const std::string& path);
    // Save data to a file
    void save(const std::string& fileName, const std::string& data) override;
    // Load data from a file
    std::string load(const std::string& fileName) const override;
    // Remove a file from the repository
    void remove(const std::string& fileName) override;
    // List all files in the base directory
    std::vector<std::string> listFiles() const override;
};

#endif
