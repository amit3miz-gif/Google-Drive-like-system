#ifndef IPARSER_H
#define IPARSER_H

#include <string>
#include <utility> 

// Interface for parser interactions 
class IParser {
public:
    virtual ~IParser() = default;
    // reads the next line from input and parses it
    virtual std::pair<std::string, std::string> nextCommand() = 0;
    
};

#endif