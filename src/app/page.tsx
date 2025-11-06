"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [receivedMessages, setReceivedMessages] = useState<
    { id: string; message: string; name?: string }[]
  >([]);
  const [anotherPointer, setAnotherPointer] = useState<
    | {
        id?: string;
        x: number;
        y: number;
        color?: string;
        content?: string;
      }[]
    | null
  >(null);
  const [name, setName] = useState("Client");
  const [pointerContent, setPointerContent] = useState("");

  const socketRef = useRef<Socket | null>(null);

  const getRandomColor = () => {
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#FF8333",
      "#33FFA1",
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
          content: pointerContent,
        });
      }
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [pointerContent]);

  useEffect(() => {
    const socket = io("https://socketserver-ohdu.onrender.com/");
    // const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server!");
      setConnectionStatus("Connected");
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from server!");
      setConnectionStatus("Disconnected");
      if (reason) {
        setReceivedMessages((prev) => [
          ...prev,
          { id: "Error", message: "Disconnected: " + reason },
        ]);
      }
    });

    socket.on("message", (message: { id: string; message: string }) => {
      setReceivedMessages((prev) => [...prev, message]);
    });

    socket.on(
      "pointersMove",
      (message: { id: string; x: number; y: number }) => {
        if (message.x != 0 && message.y != 0) {
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
          {anotherPointer.map((pointer, index) =>
            !pointer.content ? (
              <div
                key={index}
                className="absolute w-6 hover:outline-2 h-6 rotate-[20deg] origin-top-left rounded-full pointer-events-none rounded-tl-none "
                style={{
                  left: pointer.x,
                  top: pointer.y,
                  backgroundColor: pointer.color,
                }}
              ></div>
            ) : (
              <div
                key={index}
                className="absolute w-fit origin-top-left translate-x-[-50%] translate-y-[-50%] text-xl pointer-events-none"
                style={{
                  left: pointer.x,
                  top: pointer.y,
                  color: pointer.color,
                  // backgroundColor: pointer.color,
                }}
              >
                {pointer.content}
              </div>
            )
          )}
        </div>
      )}
      <div className="flex items-center justify-center">
        <input
          className="text-3xl mt-5 text-center rounded-lg px-2 w-40"
          type="text"
          name="name"
          id="name"
          placeholder="Name"
          onChange={(e) => {
            setName(e.target.value);
          }}
          defaultValue={"Client"}
        />
        <input
          className="text-xl mt-5 text-center rounded-lg px-2 w-20"
          type="text"
          name="pointerContent"
          id="pointerContent"
          placeholder="ptr"
          onChange={(e) => {
            setPointerContent(e.target.value);
          }}
          defaultValue={""}
        />
      </div>
      <ol className="flex overflow-auto flex-col justify-center m-auto gap-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded-full  [&::-webkit-scrollbar-thumb]:bg-gray-200/50 [&::-webkit-scrollbar-thumb]:rounded-full w-fit px-10 h-[80vh] ">
        {receivedMessages.map((message, index) => (
          <li key={index} className="text-xl flex gap-2 items-center">
            <div className="flex gap-1 items-center">
              <span className="rounded-full p-1 bg-slate-400/10 items-center text-[6px]">
                {message.id.slice(0, 5)}
              </span>
              {message.name && (
                <span className="rounded-sm p-1 bg-slate-400/20 items-center text-[12px]">
                  {message.name}
                </span>
              )}
            </div>
            <span
              className={`${
                window.matchMedia("(prefers-color-scheme: light)").matches
                  ? "bg-[#c4c4c474]"
                  : "bg-[#3838388e]"
              } px-4 py-1 rounded-4xl max-w-2xl text-wrap`}
            >
              {message.message}
            </span>
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
