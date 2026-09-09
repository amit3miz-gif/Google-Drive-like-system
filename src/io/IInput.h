#ifndef IINPUT_H
#define IINPUT_H

#include <string>

// Interface for any input source.
class IInput {
public:
    virtual ~IInput() = default;
    virtual std::string readLine() = 0;
    virtual bool isEof() const { return false; } 
};

#endif