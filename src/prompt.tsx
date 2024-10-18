import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import './prompt.css'; // Import the CSS file

interface ApiResponse {
  message: string;
  sessionId?: string;
}
const BACKEND_URL = "https://python-backend-28440209445.us-central1.run.app";

// Utility function to parse the response and format it properly
const formatResponse = (message: string) => {
  // Split the message by newlines
  const lines = message.split('\n');

  return (
    <div style={{ textAlign: 'left' }}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Check if the line starts with "* " (asterisk followed by space) to detect bullet points
        if (trimmedLine.startsWith('* ')) {
          let bulletContent = trimmedLine.substring(2).trim(); // Remove "* " and trim

          // Check and format bold text within the bullet content
          bulletContent = bulletContent.replace(/\*\*(.*?)\*\*/g, (_, p1) => {
            return `<strong>${p1}</strong>`;
          });

          return (
            <ul key={index}>
              <li dangerouslySetInnerHTML={{ __html: bulletContent }} />
            </ul>
          );
        }

        // Replace "**text**" with bold formatting for non-bullet lines
        const boldText = trimmedLine.replace(/\*\*(.*?)\*\*/g, (_, p1) => {
          return `<strong>${p1}</strong>`;
        });

        // Return the formatted line as HTML
        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: boldText }} />
        );
      })}
    </div>
  );
};

const PromptComponent: React.FC = () => {
  const [ageInput, setAge] = useState<string>(''); // State for storing the user's age input
  const [hobbyInput, setHobby] = useState<string>(''); // State for storing the user's hobby input
  const [otherInput, setOtherInfo] = useState<string>(''); // State for storing the user's hobby input
  const [promptInput, setPrompt] = useState<string>(''); // State for storing the user's prompt
  const [sessionId, setSessionId] = useState<string | null>(null); // State for storing the session ID
  const [history, setHistory] = useState<JSX.Element[]>([]); // State for storing the conversation history
  const [loading, setLoading] = useState<boolean>(false); // State for tracking loading status

  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Function to scroll to the bottom of the message container
  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };
  // Call scrollToBottom whenever the history changes
  useEffect(() => {
    scrollToBottom();
  }, [history]);


  // Function to handle input change
  const handleAgeInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setAge(e.target.value);
  };
  const handleHobbyInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setHobby(e.target.value);
  };
  const handleOtherInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setOtherInfo(e.target.value);
  };
  const handlePromptInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setPrompt(e.target.value);
  };

  // Function to handle form submission for initial user info
  const handleUserInfo = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      setHistory((prevHistory) => [...prevHistory, <div key={prevHistory.length} className="llm-message">Typing...</div>]);
      const res = await fetch(`${BACKEND_URL}/api/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstPost: true, age: ageInput, hobby: hobbyInput, other: otherInput }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: ApiResponse = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Update the history with the formatted response
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <div key={prevHistory.length} className="llm-message">{formatResponse(data.message)}</div>,
      ]);
    } catch (error) {
      console.error('Error:', error);
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <p key={prevHistory.length}>Error: Failed to fetch response from server</p>,
      ]);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  // Function to handle form submission for follow-up prompts
  const handleUserPrompt = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true); // Set loading to true

    try {
      // Add the user's prompt to the history immediately
      setHistory((prevHistory) => [
        ...prevHistory,
        <div key={prevHistory.length} className="user-message">{promptInput}</div>,
        <div key={prevHistory.length + 1} className="llm-message">Typing...</div>,
      ]);

      const res = await fetch(`${BACKEND_URL}/api/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstPost: false, prompt: promptInput, sessionId: sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      
      // Clear the prompt input after submission
      setPrompt('');
      const data: ApiResponse = await res.json();

      // Replace the "Loading..." message with the formatted response
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <div key={prevHistory.length} className="llm-message">{formatResponse(data.message)}</div>,
      ]);
    } catch (error) {
      console.error('Error:', error);
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <p key={prevHistory.length}>Error: Failed to fetch response from server</p>,
      ]);
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div>
      <h2>Initial User Information</h2>
      <form onSubmit={handleUserInfo}>
        <input
          type="number"
          value={ageInput}
          onChange={handleAgeInput}
          placeholder="Enter User Age"
          required
        />
        <input
          type="text"
          value={hobbyInput}
          onChange={handleHobbyInput}
          placeholder="Enter User Hobby"
          required
        />
        <input
          type="text"
          value={otherInput}
          onChange={handleOtherInput}
          placeholder="Enter Other User Info"
          required
        />
        <button type="submit" disabled={loading}>Send</button>
      </form>
      <div>The above form should be hidden from the user when deployed.
        The form is used to send any user info that we collect prior to accessing the chatbot below (currently asks for "age", "hobby", and "other user info"). 
        The information from this form will be used to initiate a relevant conversation with the user for tour guidance.</div>
      <br/>
      <h2>Chatbot</h2>
      <div className='message-container'>
        <div className="history-container" ref={messageContainerRef}>
          {history.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>

        <form onSubmit={handleUserPrompt}>
          <input
            type="text"
            className="prompt-input"
            value={promptInput}
            onChange={handlePromptInput}
            placeholder="メッセージやご質問を入力してください"
            required
          />
          <button type="submit" className="send-button" disabled={loading}>送信</button>
        </form>
      </div>
    </div>
  );
};

export default PromptComponent;
