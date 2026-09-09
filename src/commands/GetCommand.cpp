#include "GetCommand.h"
#include <sstream>

GetCommand::GetCommand(IFileRepository& repo, ICompressor& compressor)
    : repo_(repo), compressor_(compressor) {
}

std::string GetCommand::name() const {
    return "get";
}

void GetCommand::setArgs(const std::string& args) {
    // reset previous state
    fileName.clear();
    // Extract the file name (first token in args)
    std::istringstream iss(args);
    iss >> fileName;
}

CommandResult GetCommand::execute() {
    // Missing file name -  bad request
    if (fileName.empty()) {
        return {400, ""};
    }

    try {
        // Load compressed content from repository
        std::string compressedContent = repo_.load(fileName);

        // Decompress content
        std::string decompressedContent = compressor_.decompress(compressedContent);

        // Success: return decompressed body
        return {200, decompressedContent};
    }
    catch (const FileNotFoundError&) {
        // file does not exist
        return {404, ""};
    }
    catch (...) {
        // Any other unexpected failure
        return {500, ""};
    }
}
