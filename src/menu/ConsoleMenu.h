#ifndef CONSOLE_MENU_H
#define CONSOLE_MENU_H

#include "IMenu.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"
#include "commands/DeleteCommand.h"
#include "storage/IFileRepository.h"
#include "compression/ICompressor.h"

// Implementation of IMenu for a console application.
// It knows how to build all available commands using the shared services
// (repository, compressor) and expose them as a name->command map.
class ConsoleMenu : public IMenu {
public:
    ConsoleMenu(IFileRepository& repo, ICompressor& compressor);
    std::map<std::string, ICommand*> createCommands() override;

private:
    IFileRepository& repo;
    ICompressor& compressor;
};

#endif