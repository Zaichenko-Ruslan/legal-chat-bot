'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the structure of a message object
interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus(`Обрано: ${e.target.files[0].name}`);
    } else {
      setSelectedFile(null);
      setUploadStatus('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Будь ласка, спочатку оберіть файл.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploadStatus('Завантаження файлу...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/proxy/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка завантаження файлу');
      }

      setUploadStatus(`Файл "${data.filename}" успішно завантажено.`);
      setSelectedFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setUploadStatus(`Помилка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const replyText = data.reply || "Немає відповіді від сервера.";

      // Check if the reply is an error message from the backend
      if (replyText.startsWith("Помилка:")) {
        console.error("Backend error:", replyText);
      }

      const botMessage: Message = { sender: 'bot', text: replyText };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage: Message = { sender: 'bot', text: "Помилка: не вдалося з'єднатися з сервером." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-2xl h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle>Юридичний Помічник</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${ 
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
               {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                   <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 bg-gray-200 text-gray-900">
                      <p className="text-sm">Аналізую запит...</p>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t">
           <div className="flex items-center gap-2 mb-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".docx"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedFile) {
                    handleFileUpload();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isLoading}
              >
                {selectedFile ? `Завантажити` : 'Обрати файл'}
              </Button>
              {uploadStatus && <p className="text-sm text-gray-500 ml-2 truncate">{uploadStatus}</p>}
           </div>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Введіть ваше запитання..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              Надіслати
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}