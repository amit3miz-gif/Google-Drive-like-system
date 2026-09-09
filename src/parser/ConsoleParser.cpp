#include "parser/ConsoleParser.h"
#include <cctype>


ConsoleParser::ConsoleParser(IInput& input)
    : m_input(input)
{}

bool ConsoleParser::isWhitespaceOnly(const std::string& s)
{
    for (unsigned char ch : s) {
        if (!std::isspace(ch)) {
            return false;
        }
    }
    return true;
}

std::string ConsoleParser::toLower(const std::string& s)
{
    std::string result;
    result.reserve(s.size());
    for (char ch : s) {
        result.push_back(
            static_cast<char>(std::tolower(static_cast<unsigned char>(ch)))
        );
    }
    return result;
}

void ConsoleParser::parseLine(const std::string& line,
                            std::string& commandNameOut,
                            std::string& argsOut) const
{
    commandNameOut.clear();
    argsOut.clear();

    if (line.empty()) {
        return;
    }

    // command cannot begin with whitespace
    if (std::isspace(static_cast<unsigned char>(line[0]))) {
        return; //treated as no-command
    }

    const std::size_t n = line.size();
    std::size_t pos = 0;

    // read command name until first whitespace - the seporator
    std::size_t startCmd = pos;

    while (pos < n && !std::isspace(static_cast<unsigned char>(line[pos]))) {
        ++pos;
    }

    commandNameOut = line.substr(startCmd, pos - startCmd);

    if (pos == n) {
        argsOut.clear();
        return;
    }

    // Skip exactly one space - the separator
    ++pos;

    if (pos >= n) {
        argsOut.clear();
        return;
    }

    // all remaining content (including spaces) is args
    argsOut = line.substr(pos);
}

std::pair<std::string, std::string> ConsoleParser::nextCommand()
{
    std::string line = m_input.readLine();

    // check for EOF
    if (m_input.isEof() && (line.empty() || isWhitespaceOnly(line))) {
        return { "_EOF_", "" };
    }

    if (line.empty() || isWhitespaceOnly(line)) {
        return { "", "" };
    }

    std::string cmdName;
    std::string args;
    parseLine(line, cmdName, args);

    if (cmdName.empty()) {
        return { "", "" };
    }
    
    cmdName = toLower(cmdName);

    return { cmdName, args };
}



