#include "Server/ThreadPool.h"
#include <gtest/gtest.h>
#include <atomic>
#include <chrono>
#include <thread>

// Single job is executed
TEST(ThreadPoolTest, SingleJobExecutes) {
    ThreadPool pool(2);

    std::atomic<bool> executed{false};

    pool.submit([&]() {
        executed = true;
    });

    // Wait a bit to allow execution
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    EXPECT_TRUE(executed.load());
}

// Multiple jobs are executed and modify shared counter
TEST(ThreadPoolTest, MultipleJobsIncrementCounter) {
    ThreadPool pool(4);
    std::atomic<int> counter{0};

    const int numJobs = 20;
    for (int i = 0; i < numJobs; ++i) {
        pool.submit([&counter]() {
            counter.fetch_add(1);
        });
    }

    // Wait a bit to allow all jobs to finish
    std::this_thread::sleep_for(std::chrono::milliseconds(300));

    EXPECT_EQ(counter.load(), numJobs);
}
