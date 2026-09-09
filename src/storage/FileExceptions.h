#ifndef FILE_EXCEPTIONS_H
#define FILE_EXCEPTIONS_H

#include <stdexcept>
#include <string>

// Specific repository exceptions

// Thrown when a file does not exist
class FileNotFoundError : public std::runtime_error {
public:
    explicit FileNotFoundError(const std::string& path)
        : std::runtime_error("File not found: " + path) {}
};

// Thrown when a file exists but cannot be opened/read
class FileOpenError : public std::runtime_error {
public:
    explicit FileOpenError(const std::string& path)
        : std::runtime_error("Cannot open file for reading: " + path) {}
};

// Thrown when a file could not be removed for any reason
class FileRemoveFailed : public std::runtime_error {
public:
    explicit FileRemoveFailed(const std::string& path)
        : std::runtime_error("Failed to remove file: " + path) {}
};




#endif