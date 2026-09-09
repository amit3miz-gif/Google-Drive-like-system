#include "TaskQueue.h"

TaskQueue::TaskQueue() : _closed(false) {}

// Add a new job to the queue and notify one waiting worker
void TaskQueue::push(const std::function<void()>& job) {
    std::unique_lock<std::mutex> lock(_mtx);
    if (_closed) {
        return;
    }
    _queue.push(job);
    _cv.notify_one();
}

// Wait for a job to be available and pop it.
// Returns false if the queue is closed and empty.
bool TaskQueue::pop(std::function<void()>& job) {
    std::unique_lock<std::mutex> lock(_mtx);

    // Wait until there is a job or the queue is closed
    _cv.wait(lock, [this]() {
        return _closed || !_queue.empty();
    });

    if (_queue.empty() && _closed) {
        return false;
    }

    job = _queue.front();
    _queue.pop();
    return true;
}

// Close the queue and wake up all waiting workers
void TaskQueue::close() {
    std::unique_lock<std::mutex> lock(_mtx);
    _closed = true;
    _cv.notify_all();
}
