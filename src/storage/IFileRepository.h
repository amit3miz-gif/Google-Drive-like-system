#ifndef I_FILE_REPOSITORY_H
#define I_FILE_REPOSITORY_H

#include <string>
#include <vector>
using namespace std;

class IFileRepository {
public:
    virtual ~IFileRepository() = default;

    // Save data to fileName
    virtual void save(const string& fileName, const string& data) = 0;

    // Load data from fileName
    virtual string load(const string& fileName) const = 0;

    // Remove fileName from the repository
    virtual void remove(const string& fileName) = 0;

    // List all files from the repository
    virtual vector<string> listFiles() const = 0;
};

#endif
