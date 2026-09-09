#ifndef STDININPUT_H
#define STDININPUT_H

#include "IInput.h"
#include <string>

// implementation of IInput that reads from std::cin
class StdinInput : public IInput {
public:
    StdinInput() = default;
    std::string readLine() override;
};

#endif 
