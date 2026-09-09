#include "AddCommand.h"
#include <sstream>
#include <algorithm>

AddCommand::AddCommand(IFileRepository& repo, ICompressor& compressor)
    : repo_(repo), compressor_(compressor)
{}

std::string AddCommand::name() const {
    return "post";
}

void AddCommand::setArgs(const std::string& args) {
    // reset previous state
    fileName.clear();
    text.clear();

    // Split the arguments, first token = fileName, rest = text
    std::istringstream iss(args);
    iss >> fileName;

    if (fileName.empty()) {
        return;
    }

    std::getline(iss, text);
    if (!text.empty() && text[0] == ' ') {
        text.erase(0, 1); // remove leading space
    }
}

CommandResult AddCommand::execute() {
    // Missing file name argument
    if (fileName.empty()) {
        return {400, ""};
    }
    // Check for duplicate file name
    try {
        std::vector<std::string> existing = repo_.listFiles();
        if (std::find(existing.begin(), existing.end(), fileName) != existing.end()) {
            // File already exists, cannot add duplicate
            return {404, ""};
        }
    } catch (...) {
        // Repository failure while listing files - internal error
        return {500, ""};
    }
    // Try to compress and save the new file
    try {
        std::string compressed = compressor_.compress(text);
        repo_.save(fileName, compressed);
        // Successfully added
        return {201, ""};
    } catch (...) {
        // Error during compression or saving - internal error
        return {500, ""};
    }
}
    
