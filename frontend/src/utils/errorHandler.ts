import { toast } from 'react-toastify';
import axios from 'axios';

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      toast.error(`Error: ${error.response.data.message || 'An unexpected error occurred'}`);
    } else if (error.request) {
      // The request was made but no response was received
      toast.error('No response received from the server. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error('An error occurred while processing your request. Please try again.');
    }
  } else {
    // For non-Axios errors
    toast.error('An unexpected error occurred. Please try again.');
  }
  console.error('API Error:', error);
};
