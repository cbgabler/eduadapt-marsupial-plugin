import { useState } from 'react';

function importData() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFilePath = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');


  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if(!window.api || !window.api.importData) {
        setMessage("Error: Electron API is not available. Please run this in Electron")
        setIsLoading(false)
        return;
      } 

      const result = await window.api.importData(filePath)
    } catch (err) {

    }
  }; 
  
  return (
    <div className='import-data-container'>
      
    </div>
  );
}