#include "DeleteCommand.h"
#include <sstream>

using namespace std;    

DeleteCommand::DeleteCommand(IFileRepository& repo)
    : repo_(repo)
{}  

string DeleteCommand::name() const {
    return "delete";
}

void DeleteCommand::setArgs(const string& args) {
    fileName.clear(); // reset previous state

    // Split the arguments, first token = fileName
    istringstream iss(args);
    iss >> fileName;

    // If there are extra tokens after the file name, mark as invalid
    string extra;
    if (!(fileName.empty()) && (iss >> extra)) {
        // Too many arguments: mark as invalid by clearing fileName
        fileName.clear();       
    }
}

CommandResult DeleteCommand::execute() {
    // Missing or invalid file name argument
    if (fileName.empty()) {
        return {400, ""};
    }
    // Try to remove the file
    try {
        repo_.remove(fileName);
        // Successfully removed
        return {204, ""};
    }
    catch (const FileNotFoundError&) {
        // File does not exist in the repository
        return {404, ""};
    }
    catch (...) {
        // Any other unexpected internal failure
        return {500, ""};
    }
}
