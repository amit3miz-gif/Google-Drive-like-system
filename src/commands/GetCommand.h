#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include "ICommand.h"
#include "storage/IFileRepository.h"
#include "storage/FileExceptions.h"
#include "compression/ICompressor.h"
#include <string>

// Command for getting the content of a compressed file
class GetCommand : public ICommand {
private:
    std::string fileName;
    IFileRepository& repo_;
    ICompressor& compressor_;

public:
    GetCommand(IFileRepository& repo, ICompressor& compressor);
    std::string name() const override;
    void setArgs(const std::string& args) override;
    CommandResult execute() override; // Returns CommandResult instead of bool
};

#endif 
