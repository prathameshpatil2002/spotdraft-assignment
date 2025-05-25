import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const Register: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        try {
            await register(username, email, password);
            toast.success('Registration successful!');
        } catch (error) {
            toast.error('Registration failed. Please try again.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Register
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3 }}
                        >
                            Register
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}; 