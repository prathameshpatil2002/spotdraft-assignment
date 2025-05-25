import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username, password);
            toast.success('Login successful!');
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Login
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3 }}
                        >
                            Login
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}; 