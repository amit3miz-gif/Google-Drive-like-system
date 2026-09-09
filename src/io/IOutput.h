#ifndef IOUTPUT_H
#define IOUTPUT_H

#include <string>

// Interface for any output target.
class IOutput {
public:
    virtual ~IOutput() = default;
    virtual void writeLine(const std::string& line) = 0;
};

#endif 
