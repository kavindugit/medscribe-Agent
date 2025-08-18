import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import axios from 'axios';

export default function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState(false); // State for email validation error
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setEmailError(false); // Reset email error state

    // Validate email
    if (!email) {
      setEmailError(true); // Set email error state
      setMessage('Email is required.'); // Set the message
      setLoading(false);
      return;
    }

    try {
      axios.defaults.withCredentials = true; // Ensure cookies are sent with requests
      const { data } = await axios.post('http://localhost:4000/api/auth/send-reset-otp', {
        email,
      });

      if (data.success) {
        navigate('/reset-password', { state: { email } });
      } else {
        setMessage(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error('Error:', error); // Log the error for debugging
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <DialogContentText>
          Enter your email, and we&apos;ll send you a reset OTP.
        </DialogContentText>
        <OutlinedInput
          autoFocus
          required
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(false); // Clear email error when user types
          }}
          error={emailError} // Apply error styling
        />
        {emailError && <p style={{ color: 'red', margin: 0 }}>Email is required.</p>}
        {message && <p style={{ color: 'red', margin: 0 }}>{message}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}