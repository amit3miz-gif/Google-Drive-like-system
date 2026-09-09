cmake_minimum_required(VERSION 3.10)

project(Drive)

set(CMAKE_CXX_STANDARD 17)

include(FetchContent)
FetchContent_Declare(
    googletest
    URL https://github.com/google/googletest/archive/refs/tags/release-1.11.0.zip
)

# Collect source files 
file(GLOB APP_SOURCES
    "${CMAKE_SOURCE_DIR}/src/app/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/commands/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/compression/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/io/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/parser/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/storage/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/menu/*.cpp"
    "${CMAKE_SOURCE_DIR}/src/Server/AppClientHandler.cpp"
    "${CMAKE_SOURCE_DIR}/src/Server/TCPServer.cpp"
    "${CMAKE_SOURCE_DIR}/src/Server/ThreadPool.cpp"
    "${CMAKE_SOURCE_DIR}/src/Server/TaskQueue.cpp"
    "${CMAKE_SOURCE_DIR}/src/client/ClientTCP.cpp"
)

set(SERVER_MAIN_FILE "${CMAKE_SOURCE_DIR}/src/Server/main_server.cpp")
set(CLIENT_MAIN_FILE "${CMAKE_SOURCE_DIR}/src/client/main_client.cpp")


# Server executable
add_executable(Drive ${APP_SOURCES} ${SERVER_MAIN_FILE})
target_include_directories(Drive PRIVATE ${CMAKE_SOURCE_DIR}/src)

# Client executable
add_executable(Client ${APP_SOURCES} ${CLIENT_MAIN_FILE})
target_include_directories(Client PRIVATE ${CMAKE_SOURCE_DIR}/src)

# Collect all final test source files (not unit)
file(GLOB TEST_FILES
    "${CMAKE_SOURCE_DIR}/tests/*.cpp"
    "${CMAKE_SOURCE_DIR}/tests/FinalTests/*.cpp"
    
)

add_executable(runTests ${APP_SOURCES} ${TEST_FILES})
target_include_directories(runTests PRIVATE ${CMAKE_SOURCE_DIR}/src)

set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

target_link_libraries(runTests gtest_main)