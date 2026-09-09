#include "Server/TaskQueue.h"
#include <gtest/gtest.h>
#include <thread>
#include <chrono>
#include <atomic>
#include <functional>

// Basic push/pop in the same thread
TEST(TaskQueueTest, PushPopSameThread) {
    TaskQueue q;

    std::atomic<bool> executed{false};
    q.push([&executed]() {
        executed = true;
    });

    std::function<void()> job;
    bool ok = q.pop(job);

    EXPECT_TRUE(ok);
    EXPECT_FALSE(executed.load()); // not executed yet
    job();
    EXPECT_TRUE(executed.load());
}

// Pop blocks until another thread pushes
TEST(TaskQueueTest, PopBlocksUntilPush) {
    TaskQueue q;
    std::atomic<bool> executed{false};

    std::thread t([&]() {
        // small delay to ensure pop waits
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
        q.push([&executed]() {
            executed = true;
        });
    });

    std::function<void()> job;
    bool ok = q.pop(job);

    t.join();
    EXPECT_TRUE(ok);
    EXPECT_FALSE(executed.load());
    job();
    EXPECT_TRUE(executed.load());
}

// Close makes pop return false when queue is empty
TEST(TaskQueueTest, CloseMakesPopReturnFalse) {
    TaskQueue q;
    q.close();

    std::function<void()> job;
    bool ok = q.pop(job);

    EXPECT_FALSE(ok);
}
