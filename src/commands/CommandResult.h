#ifndef CommandResult_H    
#define CommandResult_H

#include <string>

// Structure to hold the result of a command execution
struct CommandResult {
    int statusCode;
    std::string body;
};

#endif