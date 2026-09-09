#include "FileStorageRepository.h"
#include <fstream>
#include <stdexcept>
#include <filesystem>
#include <sstream>

namespace fs = std::filesystem;

// Constructor, stores the base directory path
FileStorageRepository::FileStorageRepository(const std::string& path)
    : basePath(path)
{
    // Ensure the base directory exists, create it if it doesn't
    if (!fs::exists(basePath)) {
        fs::create_directories(basePath);
    }
}

// Save the given data under fileName inside basePath
void FileStorageRepository::save(const std::string& fileName, const std::string& data) {
    std::lock_guard<std::mutex> lock(mtx); // lock shared storage
    std::string fullPath = basePath + "/" + fileName;
    std::ofstream stream(fullPath, std::ios::binary);
    if (!stream) {
        throw FileOpenError(fullPath);
    }
    stream << data;
    stream.close();
}

// Load content from fileName inside basePath
std::string FileStorageRepository::load(const std::string& fileName) const {
    std::lock_guard<std::mutex> lock(mtx); // lock shared storage
    std::string fullPath = basePath + "/" + fileName;
    std::ifstream stream(fullPath, std::ios::binary);
    
    if (!stream.is_open()) {
        // Check if file exists before throwing specific error
        std::ifstream check(fullPath);
        if (!check.is_open()) {
            throw FileNotFoundError(fullPath);
        }
        throw FileOpenError(fullPath);
    }
    std::ostringstream contents;
    contents << stream.rdbuf();
    stream.close();
    return contents.str();
}

// Remove the specified file from basePath 
void FileStorageRepository::remove(const std::string& fileName) {
    std::lock_guard<std::mutex> lock(mtx); // lock shared storage
    std::string fullPath = basePath + "/" + fileName;

    if (!fs::exists(fullPath)) {
        // Logical error: file does not exist
        throw FileNotFoundError(fullPath);
    }

    if (!fs::remove(fullPath)) {
        // System/IO error: failed to remove existing file
        throw FileRemoveFailed(fullPath);
    }
}


// Return a list of all file names in basePath
std::vector<std::string> FileStorageRepository::listFiles() const {
    std::lock_guard<std::mutex> lock(mtx); // lock shared storage
    std::vector<std::string> files;
    for (const auto& entry : fs::directory_iterator(basePath)) {
        if (!entry.is_directory()) {
            files.push_back(entry.path().filename().string());
        }
    }
    return files;
}
