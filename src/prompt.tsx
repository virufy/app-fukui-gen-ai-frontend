import React, { useState, ChangeEvent, FormEvent } from 'react';

interface ApiResponse {
  message: string; // Define the expected shape of the API response
}

const PromptComponent: React.FC = () => {
  const [ageInput, setAge] = useState<string>('');       // State for storing the user's age input 
  const [hobbyInput, setHobby] = useState<string>('');       // State for storing the user's hobby input
  const [response, setResponse] = useState<string>('');   // State for storing the server's response
  const [loading, setLoading] = useState<boolean>(false); // State for tracking loading status

  // Function to handle input change
  const handleAgeInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setAge(e.target.value);
  };
  const handleHobbyInput = (e: ChangeEvent<HTMLInputElement>): void => {
    setHobby(e.target.value);
  };

  // Function to handle form submission and make a request to the backend
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true); // Set loading status

    try {
      // Fetch call to backend (replace http://localhost:8080/api/prompt with your backend endpoint)
      const res = await fetch('http://localhost:8080/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ age: ageInput, hobby: hobbyInput}),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const data: ApiResponse = await res.json();
      setResponse(data.message); // Assuming the server returns a JSON with 'message'
    } catch (error) {
      console.error('Error:', error);
      setResponse('Failed to fetch response from server');
    } finally {
      setLoading(false); // Stop loading status
    }
  };

  return (
    <div>
      <h1>Prompt Input</h1>
      <form onSubmit={handleSubmit}>
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
        <h2>Response:</h2>
        {loading ? <p>Loading...</p> : <p>{response}</p>}
      </div>
    </div>
  );
};

export default PromptComponent;
