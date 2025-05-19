"use client";

import { get } from "http";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [receivedMessages, setReceivedMessages] = useState<
    { id: string; message: string; name?: string }[]
  >([]);
  const [anotherPointer, setAnotherPointer] = useState<
    | {
        id?: String;
        x: number;
        y: number;
        color?: string;
      }[]
    | null
  >(null);
  const [name, setName] = useState("Client");

  const socketRef = useRef<Socket | null>(null);

  const getRandomColor = () => {
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#FF8333",
      "#33FFA1",
      "#A133FF",
      "#FF33FF",
      "#33FF33",
      "#FF33FF",
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#FF8333",
      "#33FFA1",
      "#A133FF",
      "#FF33FF",
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  };

  // const handleChange = (event: ChangeEvent) => {
  //   const message = (event.target as HTMLInputElement).value;

  //   if (socketRef.current && message) {
  //     socketRef.current.emit("message", message);
  //   }
  // };
  const handleSubmit = (formData: FormData) => {
    const message = formData.get("message");
    // Emit the message to the server
    if (socketRef.current && message) {
      socketRef.current.emit("message", {
        id: socketRef.current.id,
        name,
        message,
      });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [receivedMessages]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (socketRef.current) {
        socketRef.current.emit("pointerMove", {
          id: socketRef.current.id,
          x: event.clientX,
          y: event.clientY,
        });
      }
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const socket = io("https://socket-server-flame.vercel.app/");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server!");
      setConnectionStatus("Connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server!");
      setConnectionStatus("Disconnected");
    });

    socket.on("message", (message: { id: string; message: string }) => {
      setReceivedMessages((prev) => [...prev, message]);
    });

    socket.on(
      "pointersMove",
      (message: { id: string; x: number; y: number }) => {
        if (message.x > 0 && message.y > 0) {
          setAnotherPointer((prev) => {
            if (prev) {
              const ptr = prev.findIndex(
                (pointer) => pointer.id === message.id
              );
              if (ptr !== -1) {
                return [
                  ...prev.slice(0, ptr),
                  { ...prev[ptr], ...message },
                  ...prev.slice(ptr + 1),
                ];
              }
              return [...prev, { ...message, color: getRandomColor() }];
            } else {
              return [{ ...message, color: getRandomColor() }];
            }
          });
        } else {
          setAnotherPointer((prev) => {
            if (prev)
              return prev.filter((pointer) => pointer.id !== message.id);
            return null;
          });
        }
        // setAnotherPointer((prev) => [message]);
        // setAnotherPointer((prev) => [...(prev ?? []), message]);
      }
    );
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("basicEmit");
      socket.off("hello");
      socket.disconnect();
    };
  }, []);
  return (
    <>
      {anotherPointer && (
        <div className="fixed top-0 left-0 pointer-events-none w-full h-full">
          {anotherPointer.map((pointer, index) => (
            <div
              key={index}
              className="absolute w-6 hover:outline-2 h-6 rotate-[20deg] origin-top-left rounded-full pointer-events-none rounded-tl-none "
              style={{
                left: pointer.x,
                top: pointer.y,
                backgroundColor: pointer.color,
              }}
            ></div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center flex-col">
        <input
          className="text-3xl mt-5 text-center rounded-lg px-2 w-40"
          type="text"
          name="name"
          id="name"
          onChange={(e) => {
            setName(e.target.value);
          }}
          defaultValue={"Client"}
        />
      </div>
      <ol className="flex overflow-auto flex-col justify-center m-auto gap-x-4  w-fit h-[80vh] ">
        {receivedMessages.map((message, index) => (
          <li key={index} className="text-xl flex gap-2 items-center">
            <span className="rounded-sm p-1 bg-slate-400/10 items-center text-[6px]">
              {message.id}
            </span>
            {message.name && (
              <span className="rounded-sm p-1 bg-slate-400/20 items-center text-[10px]">
                {message.name}
              </span>
            )}

            {": "}
            {message.message}
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ol>
      <form
        className="flex flex-wrap justify-center items-center gap-4 z-10 fixed bottom-6 w-full"
        action={handleSubmit}
      >
        <label htmlFor="message" className="text-xl">
          {connectionStatus}:{" "}
        </label>
        <div className="flex gap-4 px-4 justify-center items-center">
          <input
            id="message"
            name="message"
            type="text"
            className="border rounded-xl p-4 h-8 box-border"
            required
            autoComplete="off"
          />
          <button
            type="submit"
            className="text-center p-4 py-1 h-8 border bg-amber-400/60 rounded-xl"
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
