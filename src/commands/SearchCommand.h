#ifndef SEARCHCOMMAND_H
#define SEARCHCOMMAND_H

#include "ICommand.h"
#include "storage/IFileRepository.h"
#include "storage/FileExceptions.h"
#include "compression/ICompressor.h"
#include <string>

// Command for searching for substrings within compressed files
class SearchCommand : public ICommand {
private:
    std::string searchContent;
    IFileRepository& repo_;
    ICompressor& compressor_;

public:
    SearchCommand(IFileRepository& repo, ICompressor& compressor);
    std::string name() const override;
    void setArgs(const std::string& args) override;
    CommandResult execute() override; // Returns CommandResult instead of bool
};

#endif 
