#include "StdoutOutput.h"
#include <iostream>

void StdoutOutput::writeLine(const std::string& line)
{
    std::cout << line << std::endl;
}
