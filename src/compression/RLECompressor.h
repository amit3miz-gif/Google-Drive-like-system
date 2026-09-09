#ifndef RLECOMPRESSOR_H
#define RLECOMPRESSOR_H

#include <string>
#include "ICompressor.h"
using namespace std;

// RLECompressor implements Run-Length Encoding compression algorithm.
class RLECompressor : public ICompressor {
public:
    // Compresses the input string using RLE algorithm.
    string compress(const string& input) override;

    // Decompresses the input string using RLE algorithm.
    string decompress(const string& input) override;
};

#endif 


