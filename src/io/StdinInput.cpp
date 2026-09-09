#include "StdinInput.h"
#include <iostream>
#include <string>


std::string StdinInput::readLine()
{
    std::string line;

    // returns false if EOF reached before any character is read, or on error.
    if (!std::getline(std::cin, line)) {
        return "";
    }

    return line;
}
