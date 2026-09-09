#ifndef CONSOLEPARSER_H
#define CONSOLEPARSER_H

#include "parser/IParser.h"
#include "io/IInput.h"

#include <string>
#include <utility>


// implementation of IParser that reads full lines from IInput.
class ConsoleParser : public IParser {

public:
    explicit ConsoleParser(IInput& input);
    std::pair<std::string, std::string> nextCommand() override;

private:
    IInput& m_input;
    
    // returns true if s is empty or only whitespace to avoid parsing mistakes
    static bool isWhitespaceOnly(const std::string& s);

    void parseLine(const std::string& line,
                   std::string& commandNameOut,
                   std::string& argsOut) const;
    
    
    // normalize command name to lowercase (for case-insensitive commands)
    static std::string toLower(const std::string& s);

};

#endif 


