"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [message, setMessage] = useState("Завантаження...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => {
        console.error("Помилка отримання даних:", error);
        setMessage("Не вдалося завантажити дані від backend.");
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Повідомлення від Backend:
          <code className="font-mono font-bold">&nbsp;{message}</code>
        </p>
      </div>
    </main>
  );
}
