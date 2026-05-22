import {Alert, Snackbar} from '@mui/material';
import * as React from "react";
import {useState} from "react";
import {useListener} from "react-bus";

export default function Alerts() {

    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState("success");

    const handleClose = () => {
        setOpen(false);
    };

    useListener('success', (message) => {
        setMessage(message)
        setType("success");
        setOpen(true);
    });

    useListener('warning', (message) => {
        setMessage(message)
        setType("warning");
        setOpen(true);
    });

    useListener('error', (message) => {
        setMessage(message)
        setType("error");
        setOpen(true);
    });

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            autoHideDuration={5000}
            open={open}
            onClose={handleClose}
        >
            <Alert variant="filled" severity={type}>
                { message }
            </Alert>
        </Snackbar>
    )
}