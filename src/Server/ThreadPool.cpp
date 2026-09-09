#include "ThreadPool.h"

// Construct a thread pool with a fixed number of worker threads.
// Each worker runs workerLoop() in its own thread.
ThreadPool::ThreadPool(size_t numThreads)
    : _stop(false) {

    _workers.reserve(numThreads);
    for (size_t i = 0; i < numThreads; ++i) {
        _workers.emplace_back([this]() { workerLoop(); });
    }
}

// Destructor stops the pool, closes the task queue,
// and joins all worker threads before destruction.
ThreadPool::~ThreadPool() {
    _stop = true;
    _tasks.close(); // wake all workers

    for (auto& t : _workers) {
        if (t.joinable()) {
            t.join();
        }
    }
}

// Submit a new job to the pool.
// If the pool is already stopping, the job is ignored.
void ThreadPool::submit(const std::function<void()>& job) {
    if (_stop) {
        return;
    }
    _tasks.push(job);
}

// Main worker loop executed by each thread in the pool.
// Continuously pops jobs from the task queue and executes them
// until the queue is closed and no more jobs are available.
void ThreadPool::workerLoop() {
    while (true) {
        std::function<void()> job;
        if (!_tasks.pop(job)) {
            // queue is closed and empty
            return;
        }
        job();
    }
}
