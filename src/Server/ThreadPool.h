#ifndef THREADPOOL_H
#define THREADPOOL_H

#include <vector>
#include <thread>
#include <functional>
#include <atomic>
#include "TaskQueue.h"


// Fixed-size thread pool.
// Creates N worker threads that continuously pull jobs from TaskQueue
// and execute them. Jobs are submitted via submit(job).
class ThreadPool {
public:
    explicit ThreadPool(size_t numThreads);
    ~ThreadPool();

    // Submit a new job to be executed by the pool
    void submit(const std::function<void()>& job);

private:
    void workerLoop();

    std::vector<std::thread> _workers;
    TaskQueue _tasks;
    std::atomic<bool> _stop;
};

#endif
