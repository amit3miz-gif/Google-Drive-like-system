import socket
import sys

# Python TCP client that keeps one persistent connection and prints
# server responses, including multi-line 200 bodies, matching the C++ client protocol.


def recv_line(sock: socket.socket):
    # read one byte at a time until '\n' or socket closed
    chunks = []
    while True:
        b = sock.recv(1)
        if not b:
            # server closed
            if chunks:
                return "".join(chunks)
            return None
        if b == b"\n":
            return "".join(chunks)
        chunks.append(b.decode(errors="replace"))


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <host> <port>")
        return

    server_ip = sys.argv[1]   # "server" inside docker-compose
    port = int(sys.argv[2])

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        s.connect((server_ip, port))
    except Exception as e:
        # dumb client - just prints error and exits
        sys.stderr.write(f"Failed to connect: {e}\n")
        return

    try:
        while True:
            # one line at a time
            line = sys.stdin.readline()
            if not line:
                # eof on stdin - exit
                break

            if not line.endswith("\n"):
                line += "\n"

            s.sendall(line.encode()) # send the command line to the server

            status = recv_line(s) # read status line
            if status is None:
                # server closed
                break

            print(status)

            # if this is a 200 response - read the BODY according to the same protocol as in C++
            if status.startswith("200 "):
                print("") # adding an extra empty line

                # read the separator line sent by the server after the status (should be empty)
                sep = recv_line(s)
                if sep is None:
                    break

                # read the BODY line by line until an empty line is reached
                while True:
                    body_line = recv_line(s)
                    if body_line is None:
                        # server closed in the middle of the BODY
                        return
                    if body_line == "":
                        # end of the BODY
                        break
                    print(body_line)

    finally:
        s.close()


if __name__ == "__main__":
    main()
