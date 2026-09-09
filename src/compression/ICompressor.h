#ifndef ICOMPRESSOR_H
#define ICOMPRESSOR_H

#include <string>
using namespace std;

// ICompressor defines the interface for compression algorithms.
class ICompressor {
public:
    virtual ~ICompressor() = default;

    // Compresses the input string and returns its compressed representation.
    virtual string compress(const string& input) = 0;

    // Restores the original string from its compressed form.
    virtual string decompress(const string& input) = 0;
};

#endif

