#include "SearchCommand.h"
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>

using namespace std;

// Constructor, takes references to the file repository and compressor to use.
SearchCommand::SearchCommand(IFileRepository& repo, ICompressor& compressor)
    : searchContent(""), repo_(repo), compressor_(compressor) {
}

// Returns the command name.
string SearchCommand::name() const {
    return "search";
}

// Sets the search text argument.
void SearchCommand::setArgs(const string& args) {
    searchContent.clear(); // Clear previous search content.
    searchContent = args;
}

// Executes the search command.
CommandResult SearchCommand::execute() {
    // No search text provided.
    if (searchContent.empty()) {
        return CommandResult{400, ""};
    }
    try {
        bool foundAny = false;
        vector<string> files = repo_.listFiles();
        string body;  // Accumulate matching file names.
        for (const auto& fileName : files) {
            bool match = false;
            try {
                // Load compressed data from the repository.
                string compressed = repo_.load(fileName);
                // Decompress to get the original file content.
                string original = compressor_.decompress(compressed);
                // Check if the original content contains the search text.
                if (original.find(searchContent) != string::npos) {
                    match = true;
                }
            }
            catch (...) {
                // any failure - skip this file.
                continue;
            }
            // Also match on file name itself.
            if (!match && fileName.find(searchContent) != string::npos) {
                match = true;
            }
            if (match) {
                if (!body.empty()) {
                    body += " ";
                }
                body += fileName;
                foundAny = true;
            }
        }
        if (!foundAny) {
            // No file matched content or name.
            return CommandResult{200, ""};
        }
        // At least one matching file found.
        return CommandResult{200, body};
    }
    catch (...) {
        // Any unexpected failure outside per-file logic.
        return CommandResult{500, ""};
    }
}
