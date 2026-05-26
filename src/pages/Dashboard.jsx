import {Box, Typography} from "@mui/material";

export default function Dashboard() {
    return (
        <Box>
            {/*<Typography variant="h4" gutterBottom>*/}
            {/*    Добро пожаловать на сервер Шизофрения*/}
            {/*</Typography>*/}
            <div style={{ display: 'flex', gap: "20px", height: '90vh' }}>
                {/*<div className="dashboard-image romaImage"></div>*/}
                {/*<div className="dashboard-image georgyImage"></div>*/}
                <div className="dashboard-image logo"></div>
            </div>
        </Box>
    );
}