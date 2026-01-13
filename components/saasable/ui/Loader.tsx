// @mui
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';

/***************************  COMMON - LOADER  ***************************/

export default function Loader() {
    return (
        <Stack sx={{ height: '100vh', width: 1, alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
        </Stack>
    );
}
