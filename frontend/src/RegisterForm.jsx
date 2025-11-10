import { useState } from 'react';
import './RegisterForm.css';

function RegisterForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage(''); // Clear message when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Check if window.api exists (Electron context)
      if (!window.api || !window.api.registerUser) {
        setMessage(
          'Error: Electron API not available. Please run this in Electron.'
        );
        setIsLoading(false);
        return;
      }

      const result = await window.api.registerUser(formData);

      if (result.success) {
        setMessage(`Success! User registered with ID: ${result.userId}`);
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
        });
      } else {
        setMessage(`Error: ${result.error || 'Registration failed'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message || 'An unexpected error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form-container">
      <h2>User Registration</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        {message && (
          <div
            className={`message ${
              message.includes('Error') ? 'error' : 'success'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default RegisterForm;
