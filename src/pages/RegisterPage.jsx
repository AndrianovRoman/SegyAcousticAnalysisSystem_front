import { useState } from 'react';
import { Container, Typography, TextField, Button, Link, Alert } from "@mui/material";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        const result = await register(name, email, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Ошибка регистрации');
        }
        setLoading(false);
    };

    return (
        <Container maxWidth="sm" style={{ marginTop: "100px" }}>
            <Typography variant="h4">Регистрация</Typography>

            {error && <Alert severity="error" style={{ marginBottom: "20px", marginTop: "20px" }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Имя"
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
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
                <TextField
                    fullWidth
                    label="Подтверждение пароля"
                    type="password"
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: "20px" }}
                >
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </Button>
            </form>

            <div style={{ marginTop: "15px", color: "grey" }}>
                Уже есть аккаунт? <Link component={RouterLink} to="/login" >Вход</Link>
            </div>
        </Container>
    );
}