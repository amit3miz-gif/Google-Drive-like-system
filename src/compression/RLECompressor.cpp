#include "RLECompressor.h"
#include <stdexcept>
#include <cctype>

using namespace std;

// Compresses a string using Run-Length Encoding (RLE).
string RLECompressor::compress(const string& input) {
    if (input.empty()) {
        return "";
    }

    string output;
    char currentChar = input[0];
    int count = 1;

    for (size_t i = 1; i < input.size(); ++i) {
        if (input[i] == currentChar && count < 9) { 
            // same char, increment count (max 9 for single digit)
            ++count;
        } else {
            // different char or count limit reached, flush current run
            output.push_back(currentChar);
            output.push_back(static_cast<char>('0' + count));

            // start new run
            currentChar = input[i];
            count = 1;
        }
    }

    // Flush the last run
    output.push_back(currentChar);
    output.push_back(static_cast<char>('0' + count));

    return output;
}

// Decompresses a string encoded with Run-Length Encoding (RLE).
string RLECompressor::decompress(const string& input) {
    if (input.empty()) {
        return "";
    }

    if (input.size() % 2 != 0) {
        // Each character must be followed by its count
        throw runtime_error("Malformed RLE: encoded size must be even");
    }

    string output;

    for (size_t i = 0; i < input.size(); i += 2) {
        char c = input[i];           // the character
        char countCh = input[i + 1]; // the digit

        if (!isdigit(static_cast<unsigned char>(countCh))) {
            throw runtime_error("Malformed RLE: count is not a digit");
        }

        int count = countCh - '0';
        if (count <= 0) {
            throw runtime_error("Malformed RLE: non-positive count");
        }

        // Append 'c' 'count' times
        output.append(static_cast<size_t>(count), c);
    }

    return output;
}

