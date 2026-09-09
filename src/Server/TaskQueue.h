#ifndef TASKQUEUE_H
#define TASKQUEUE_H

#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>


// Thread-safe queue for jobs
// Multiple producer threads can push jobs,
// and multiple consumer threads can pop jobs and block while the queue is empty.
class TaskQueue {
public:
    TaskQueue();
    void push(const std::function<void()>& job);   // Add a new job to the queue and notify one waiting worker
    bool pop(std::function<void()>& job);   // Wait for a job to be available and pop it.
    void close();                  // Mark the queue as closed and wake up all waiting threads

private:
    std::queue<std::function<void()>> _queue;
    std::mutex _mtx;
    std::condition_variable _cv;
    bool _closed;
};

#endif