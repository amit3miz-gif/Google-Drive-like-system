#ifndef STDOUTOUTPUT_H
#define STDOUTOUTPUT_H

#include "IOutput.h"
#include <string>

// implementation of IOutput that writes to std::cout
class StdoutOutput : public IOutput {
public:
    StdoutOutput() = default;
    void writeLine(const std::string& line) override;
};

#endif 
