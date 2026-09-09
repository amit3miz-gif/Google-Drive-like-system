#ifndef DELETECOMMAND_H
#define DELETECOMMAND_H

#include "ICommand.h"
#include "storage/IFileRepository.h"
#include "storage/FileExceptions.h"
#include <string>

// Command for deleting a file
class DeleteCommand : public ICommand {
private:
    std::string fileName;
    IFileRepository& repo_; 

public:
    DeleteCommand(IFileRepository& repo);
    std::string name() const override;
    void setArgs(const std::string& args) override;
    CommandResult execute() override;
};

#endif