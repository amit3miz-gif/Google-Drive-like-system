#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "ICommand.h"
#include "compression/ICompressor.h"
#include "storage/IFileRepository.h"
#include <string>

// Command for adding (POST) and compressing a new file
class AddCommand : public ICommand {
private:
    std::string fileName;
    std::string text; // uncompressed text to save
    IFileRepository& repo_;
    ICompressor& compressor_;
    
public:
    AddCommand(IFileRepository& repo, ICompressor& compressor);
    std::string name() const override;
    void setArgs(const std::string& args) override;
    CommandResult execute() override; // Returns CommandResult instead of bool
};

#endif 
