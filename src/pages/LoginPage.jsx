import { useState } from 'react';
import { TextField, Button, Container, Typography, Link, Alert, Box } from "@mui/material";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBus } from 'react-bus';
import './loginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const bus = useBus();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Ошибка входа');
        }
        setLoading(false);
    };

    const handleOpenForgotPassword = () => {
        console.log("open")
        bus.emit('openForgotPasswordModal');
    };

    return (
        <Container maxWidth="sm" style={{ paddingTop: "100px" }}>
            <Typography variant="h4" gutterBottom>
                Вход
            </Typography>

            {error && <Alert severity="error" style={{ marginBottom: "20px" }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Email"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                />
                <TextField
                    fullWidth
                    label="Пароль"
                    type="password"
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: "20px" }}
                >
                    {loading ? 'Вход...' : 'Войти'}
                </Button>
            </form>

            <div style={{ marginTop: "15px", color: "grey" }}>
                У вас нет аккаунта? <Link component={RouterLink} to="/register" >Регистрация</Link>
            </div>
            <div style={{ marginTop: "15px", color: "grey" }}>
                Забыли пароль? <Link component="button" onClick={handleOpenForgotPassword} style={{ cursor: 'pointer', marginLeft: '5px' }}>Сбросить пароль</Link>
            </div>
        </Container>
    );
}