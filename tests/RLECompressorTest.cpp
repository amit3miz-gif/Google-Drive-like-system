#include <gtest/gtest.h>
#include "compression/RLECompressor.h"

#include <stdexcept>
#include <string>

using namespace std;

// Sanity Test: basic compress + decompress round-trip.
TEST(RLECompressor, SimpleRoundTripSanity) {
    RLECompressor compressor;

    string original = "aaaabb";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);
}

// Boundary Test: empty string.
TEST(RLECompressor, EmptyStringBoundary) {
    RLECompressor compressor;

    string original = "";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(encoded, "");      // definition: empty -> empty
    ASSERT_EQ(decoded, original);
}

// Boundary Test: single character string.
TEST(RLECompressor, SingleCharBoundary) {
    RLECompressor compressor;

    string original = "a";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);
}

// Boundary Test: long run of a single character.
TEST(RLECompressor, LongRunBoundary) {
    RLECompressor compressor;

    string original(1000, 'x');  // "xxxx...x" 1000 times
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);

    // Check that compression actually reduced size.
    ASSERT_LT(encoded.size(), original.size());
}

// Boundary Test: runs of exactly 9 and 10 characters.
TEST(RLECompressor, RunLengthNineAndTenBoundary) {
    RLECompressor compressor;

    string nine(9, 'x');   // 9 x's
    string ten(10, 'x');   // 10 x's

    string enc9  = compressor.compress(nine);
    string enc10 = compressor.compress(ten);

    string dec9  = compressor.decompress(enc9);
    string dec10 = compressor.decompress(enc10);

    ASSERT_EQ(dec9, nine);
    ASSERT_EQ(dec10, ten);

    // 9 x's -> one pair: "x9" -> length 2
    ASSERT_EQ(enc9.size(), 2);

    // 10 x's -> should be split: "x9x1" -> length 4
    ASSERT_EQ(enc10.size(), 4);
}

// Edge Case Test: mixed patterns.
TEST(RLECompressor, MixedPatternEdge) {
    RLECompressor compressor;

    string original = "aaabccccddxyz";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);
}

// Edge Case Test: alternating characters.
TEST(RLECompressor, AlternatingCharsEdge) {
    RLECompressor compressor;

    string original = "abababababab";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);
}

// Property Test: compress followed by decompress returns original.
TEST(RLECompressor, RoundTripProperty) {
    RLECompressor compressor;

    string original = "helloooo RLE!!! 111222333";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);

    ASSERT_EQ(decoded, original);
}

// Edge Case Test: string with space characters.
TEST(RLECompressor, SpaceCharEdge) {
    RLECompressor compressor;
    string original = "aa bb";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);
    ASSERT_EQ(decoded, original);
}

// Edge Case Test: string with numeric characters.
TEST(RLECompressor, NumbersEdge) {
    RLECompressor compressor;
    string original = "1111222";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);
    ASSERT_EQ(decoded, original);
}

// Edge Case Test: string with newline and tab characters.
TEST(RLECompressor, NewlineAndTabEdge) {
    RLECompressor compressor;
    string original = "a\n\tb";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);
    ASSERT_EQ(decoded, original);
}

// Edge Case Test: string with special characters.
TEST(RLECompressor, SpecialCharsEdge) {
    RLECompressor compressor;
    string original = "!@#$%^&*()_+-={}[]|:;<>,.?/~";
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);
    ASSERT_EQ(decoded, original);
}

// Edge Case Test: string with all printable ASCII characters.
TEST(RLECompressor, AllPrintableAsciiEdge) {
    RLECompressor compressor;
    string original;
    for (char c = 32; c <= 126; ++c) {
        original += c;
    }
    string encoded  = compressor.compress(original);
    string decoded  = compressor.decompress(encoded);
    ASSERT_EQ(decoded, original);
}

// Negative Test: malformed input - odd length string.
TEST(RLECompressor, MalformedOddLengthThrows) {
    RLECompressor compressor;

    // "a" -> char without digit
    ASSERT_THROW(compressor.decompress("a"), runtime_error);

    // "a1b" -> "a1" is fine, "b" alone is not
    ASSERT_THROW(compressor.decompress("a1b"), runtime_error);
}

// Negative Test: malformed input - non-digit count.
TEST(RLECompressor, MalformedNonDigitCountThrows) {
    RLECompressor compressor;

    // second char must be a digit, here it's 'x'
    ASSERT_THROW(compressor.decompress("ax"), runtime_error);

    // "a2bx" -> "a2" ok, 'b' expected to be char, then 'x' should be digit but isn't
    ASSERT_THROW(compressor.decompress("a2bx"), runtime_error);
}

// Negative Test: malformed input - zero count.
TEST(RLECompressor, MalformedZeroCountThrows) {
    RLECompressor compressor;

    // "a0" -> zero repetitions is invalid under our encoding
    ASSERT_THROW(compressor.decompress("a0"), runtime_error);
}

