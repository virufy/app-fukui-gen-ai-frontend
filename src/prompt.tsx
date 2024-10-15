import React, { useState, ChangeEvent, FormEvent } from 'react';

interface ApiResponse {
  message: string;
  sessionId?: string;
}

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

        // Replace "**text**" with bold formatting using a regular expression for non-bullet lines
        const boldText = trimmedLine.replace(/\*\*(.*?)\*\*/g, (_, p1) => {
          return `<strong>${p1}</strong>`;
        });

        // Return the formatted line as HTML
        return (
          <p key={index} dangerouslySetInnerHTML={{ __html: boldText }} />
        );
      })}
    </div>
  );
};

const PromptComponent: React.FC = () => {
  const [ageInput, setAge] = useState<string>('');       // State for storing the user's age input 
  const [hobbyInput, setHobby] = useState<string>('');   // State for storing the user's hobby input
  const [promptInput, setPrompt] = useState<string>(''); // State for storing the user's prompt
  const [sessionId, setSessionId] = useState<string | null>(null); // State for storing the session ID
  const [history, setHistory] = useState<JSX.Element[]>([]);  // State for storing the conversation history

  // Function to handle input change
  const handleAgeInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setAge(e.target.value);
  };
  const handleHobbyInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setHobby(e.target.value);
  };
  const handlePromptInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setPrompt(e.target.value);
  };

  // Function to handle form submission for initial user info
  const handleUserInfo = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    try {
      setHistory((prevHistory) => [...prevHistory, <p key={prevHistory.length}>LLM: Loading...</p>]);
      const res = await fetch('http://localhost:8080/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstPost: true, age: ageInput, hobby: hobbyInput }),
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
        <div key={prevHistory.length}>LLM: {formatResponse(data.message)}</div>,
      ]);
    } catch (error) {
      console.error('Error:', error);
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <p key={prevHistory.length}>Error: Failed to fetch response from server</p>,
      ]);
    }
  };

  // Function to handle form submission for follow-up prompts
  const handleUserPrompt = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    try {
      // Add the user's prompt to the history immediately
      setHistory((prevHistory) => [
        ...prevHistory, 
        <p key={prevHistory.length}>User: {promptInput}</p>,
        <p key={prevHistory.length + 1}>LLM: Loading...</p>,
      ]);

      const res = await fetch('http://localhost:8080/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstPost: false, prompt: promptInput, sessionId: sessionId }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: ApiResponse = await res.json();

      // Replace the "Loading..." message with the formatted response
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <div key={prevHistory.length}>{formatResponse(data.message)}</div>,
      ]);
      // Clear the prompt input after submission
      setPrompt('');
    } catch (error) {
      console.error('Error:', error);
      setHistory((prevHistory) => [
        ...prevHistory.slice(0, prevHistory.length - 1),
        <p key={prevHistory.length}>Error: Failed to fetch response from server</p>,
      ]);
    }
  };

  return (
    <div>
      <h1>Initial User Information</h1>
      <form onSubmit={handleUserInfo}>
        <input
          type="number"
          value={ageInput}
          onChange={handleAgeInput}
          placeholder="Enter your Age"
          required
        />
        <input
          type="text"
          value={hobbyInput}
          onChange={handleHobbyInput}
          placeholder="Enter your hobby"
          required
        />
        <button type="submit">Send</button>
      </form>

      <div>
        <h2>Conversation:</h2>
        <div style={{ textAlign: 'left' }}>
          {history.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
      </div>

      <form onSubmit={handleUserPrompt}>
        <input
          type="text"
          value={promptInput}
          onChange={handlePromptInput}
          placeholder="Enter your prompt"
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default PromptComponent;
